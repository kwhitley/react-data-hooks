import { useState, useEffect, useRef } from 'react'
import { useStore } from 'use-store-hook'
import deepmerge from 'deepmerge'
import { fetchAxios, objectFilter, autoResolve, autoReject, getPatch, FetchStore } from './lib'

const LOG_PREFIX = '[react-use-rest]:'

// helper function to assemble endpoint parts, joined by '/', but removes undefined attributes
const getEndpoint = (...parts) => parts.filter(p => p !== undefined).join('/')

const getHash = () => ({ key: Math.floor(Math.random() * 1e12) })

// helper function to handle functions that may be passed a DOM event
const eventable = fn => (...args) => {
  let arg0 = args[0] || {}
  if (arg0.nativeEvent instanceof Event) {
    return fn()
  }

  return fn(...args)
}

const fetchStore = new FetchStore()

const createLogAndSetMeta = ({ log, setMeta }) => newMeta => {
  log('setting meta', newMeta)
  setMeta(newMeta)
}

export const createRestHook = (endpoint, createHookOptions = {}) => (...args) => {
  let [id, hookOptions] = args
  let isMountedRef = useRef(true)
  let isMounted = isMountedRef.current
  let idExplicitlyPassed = args.length && typeof args[0] !== 'object'

  if (typeof id === 'object' && hookOptions === undefined) {
    // e.g. useHook({ something })
    hookOptions = id // use first param as options
    id = undefined
  }

  // local options are a blend of factory options and instantiation options
  let options = deepmerge(createHookOptions, hookOptions || {})

  // extract options
  let {
    autoload = true,
    axios = fetchAxios,
    filter,
    getId = item => item.id, // handles the use-case of non-collections (will use id if present)
    initialValue,
    interval,
    isCollection,
    loadOnlyOnce = false,
    log = () => {},
    onAuthenticationError,
    onCreate = () => {},
    onError = console.error,
    onLoad = () => {},
    onRemove = () => {},
    onReplace = () => {},
    onUpdate = () => {},
    mergeOnCreate = true,
    mergeOnUpdate = true,
    mock,
    query = {},
    transform,
    transformCollection,
    transformItem,
  } = options

  let isCollectionExplicitlySet = options.hasOwnProperty('isCollection')
  let isFixedEndpoint = isCollection === false

  // allow { log: true } alias as well as routing to custom loggers
  log = log === true ? console.log : log

  if (axios !== fetchAxios) {
    // log('using custom axios-fetch', axios)
    fetchStore.setAxios(axios)
  }

  // if isCollection not explicitly set, try to derive from arguments
  if (!isCollectionExplicitlySet) {
    // for collections, clear id, and derive options from first param
    if (idExplicitlyPassed) {
      // e.g. useHook('foo') useHook(3)
      isCollection = false
      isFixedEndpoint = true
    } else {
      isCollection = true
    }
  } else {
    // isCollection explicitly set
    if (isCollection === false && idExplicitlyPassed) {
      let errorObj = new Error(`${LOG_PREFIX} id should not be explicitly passed with option { isCollection: false }`)
      errorObj.isCollection = isCollection
      errorObj.idExplicitlyPassed = idExplicitlyPassed
      errorObj.args = args

      onError(errorObj)
      throw errorObj
    }
  }

  // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)
  initialValue = options.hasOwnProperty('initialValue') ? initialValue : isCollection ? [] : undefined

  let queryKey =
    typeof query === 'object'
      ? Object.keys(query).length
        ? JSON.stringify(query)
        : undefined
      : typeof query === 'function'
      ? JSON.stringify({ dynamic: true })
      : undefined

  let key = 'resthook:' + getEndpoint(endpoint, (!isCollection && (id || ':id')) || undefined, queryKey)

  let [data, setData] = useStore(key, initialValue, options)
  let [loadedOnce, setLoadedOnce] = useStore(key + ':loaded.once', false)
  let [meta, setMeta] = useState({
    isLoading: autoload,
    filtered: initialValue,
    error: undefined,
    key: getHash(),
  })
  let prevFetchConfig = undefined

  const logAndSetMeta = createLogAndSetMeta({ log, setMeta })

  const handleError = (error = {}) => {
    var errorObj

    if (typeof error === 'object') {
      var { msg, data, body, status, statusText } = error

      if (!status && Number(msg)) {
        status = Number(msg)
        msg = undefined
      }

      errorObj = new Error(msg || statusText)
      let errorAttrSrc = data || body || error // matches fetch & axios response if given
      Object.keys(errorAttrSrc).forEach(key => (errorObj[key] = errorAttrSrc[key]))
    } else {
      errorObj = new Error(error)
    }

    log(`${LOG_PREFIX} handleError executed`, errorObj)

    isMounted &&
      logAndSetMeta({
        ...meta,
        isLoading: false,
        error: errorObj,
      })

    // handle authentication errors
    if (typeof onAuthenticationError === 'function' && [401, 403].includes(status)) {
      onAuthenticationError(errorObj)
    } else {
      onError(errorObj)
    }
  }

  const createActionType = (actionOptions = {}) => (item, oldItem) => {
    let itemId = id || (isFixedEndpoint ? undefined : getId(item))
    let { actionType = 'update', method = 'patch' } = actionOptions
    let payload = undefined

    log(actionType.toUpperCase(), 'on', item, 'with id', itemId)

    if (!isFixedEndpoint && !itemId && actionType !== 'create') {
      return autoReject(`Could not ${actionType} item (see log)`, {
        fn: () => {
          onError({ message: `${LOG_PREFIX} option.getId(item) did not return a valid ID`, item })
        },
      })
    }

    if (['update', 'replace'].includes(actionType)) {
      let changes = getPatch(item, oldItem)
      let isPatch = actionType === 'update'

      if (!Object.keys(changes).length) {
        return autoReject('No changes to save')
      }

      payload = isPatch ? changes : item
    }

    if (actionType === 'create') {
      payload = item
      itemId = undefined // don't build a collection/:id endpoint from item itself during POST
    }

    isMounted &&
      logAndSetMeta({
        ...meta,
        isLoading: true,
      })

    const resolve = response => {
      try {
        let newData = response.data

        if (transform) {
          newData = transform(response.data)
          log('AFTER transform:', newData)
        }

        // these calls only are fired against non-collection endpoints
        if (transformItem) {
          newData = transformItem(newData)
          log('AFTER transformItem:', newData)
        }

        // short circuit for non-collection calls
        if (!isCollection) {
          log(`non-collection action ${actionType}: setting data to`, item)
          if (actionType === 'remove') {
            onRemove(data)
            return isMounted && setData()
          }

          let updated = mergeOnUpdate ? deepmerge(item, newData) : item

          actionType === 'replace' && onReplace(updated) // event
          actionType === 'update' && onUpdate(updated) // event

          isMounted && setData(updated)

          isMounted &&
            logAndSetMeta({
              ...meta,
              isLoading: false,
              error: undefined,
              key: getHash(),
            })

          return true
        }

        if (['update', 'replace'].includes(actionType)) {
          item = mergeOnUpdate ? deepmerge(item, newData) : item

          log('updating item in internal collection', item)
          newData = data.map(i => (getId(i) === itemId ? item : i))

          actionType === 'replace' && onReplace(item) // event
          actionType === 'update' && onUpdate(item) // event
        } else if (actionType === 'create') {
          item = mergeOnCreate ? deepmerge(item, newData) : item

          log('adding item to internal collection', item)
          newData = [...data, item]

          onCreate(item) // event
        } else if (actionType === 'remove') {
          log('deleting item from internal collection')
          newData = data.filter(i => getId(i) !== itemId)

          onRemove(item) // event
        }

        // update internal data
        isMounted && setData(newData)
        isMounted &&
          logAndSetMeta({
            ...meta,
            isLoading: false,
            key: getHash(),
          })
      } catch (err) {
        handleError(err)
      }
    }

    log(`calling "${method}" to`, getEndpoint(endpoint, itemId), payload)

    // mock exit for success
    if (mock) {
      return autoResolve('Success!', { fn: resolve })
    }

    return axios[method](getEndpoint(endpoint, itemId), payload)
      .then(resolve)
      .catch(err => handleError(err.response || err))
  }

  const update = createActionType({ actionType: 'update', method: 'patch' })
  const replace = createActionType({ actionType: 'replace', method: 'put' })
  const remove = createActionType({ actionType: 'remove', method: 'delete' })
  const create = createActionType({ actionType: 'create', method: 'post' })

  // data load function
  const load = (loadOptions = {}) => {
    let opt = deepmerge(options, loadOptions)
    let { query, loadOnlyOnce } = opt
    let fetchEndpoint = getEndpoint(endpoint, id)

    // if query param is a function, run it to derive up-to-date params
    query = typeof query === 'function' ? query() : query

    log('GET', { endpoint: fetchEndpoint, query })

    isMounted &&
      logAndSetMeta({
        ...meta,
        isLoading: true,
        error: undefined,
      })

    fetchStore
      .get(fetchEndpoint, { params: query })
      .then(({ data }) => {
        try {
          if (typeof data !== 'object') {
            return onError('ERROR: Response not in object form... response.data =', data)
          }

          log('GET RESPONSE:', data)

          // all data gets base transform

          if (transform) {
            data = transform(data)
            log('AFTER transform:', data)
          }

          // if collection, transform as collection
          if (isCollection && transformCollection) {
            data = transformCollection(data)
            log('AFTER transformCollection:', data)
          }

          if (transformItem) {
            if (isCollection && data && data.length) {
              data = data.map(transformItem)
            } else {
              data = transformItem(data)
            }
            log('AFTER transformItem:', data)
          }

          if (isMounted) {
            setData(data)

            !loadedOnce && setLoadedOnce(true)

            logAndSetMeta({
              ...meta,
              filtered: data, // set filtered to loaded data... useEffect will trigger re-render with filtered data
              isLoading: false,
              error: undefined,
              key: getHash(),
            })
            onLoad(data)
          }
        } catch (err) {
          handleError(err)
        }
      })
      .catch(err => handleError(err.response || err))
  }

  // EFFECT: UPDATE FILTERED DATA WHEN FILTER OR DATA CHANGES
  useEffect(() => {
    // complete avoid this useEffect pass when no filter set or not working on collection
    if (!filter || !isCollection || !Array.isArray(data)) {
      return () => {}
    }

    log('filter changed on datahook', [filter, data])
    var filtered = data
    var prev = meta.filtered

    if (filter) {
      if (typeof filter === 'function') {
        filtered = data.filter(filter)
      } else {
        filtered = data.filter(objectFilter(filter))
      }
    }

    const sameLength = filtered.length === prev.length
    const allMatched = filtered.reduce((acc, item) => {
      return prev.includes(item) && acc
    }, true)

    if (!sameLength || !allMatched) {
      log('changes in filtered results detected, new filtered =', filtered)
      isMounted &&
        logAndSetMeta({
          ...meta,
          filtered,
          key: getHash(),
        })
    }
  }, [filter, data])

  // EFFECT: SET INITIAL LOAD, LOADING INTERVAL, ETC
  useEffect(() => {
    log('react-use-rest: id changed:', id)

    const exit = () => {
      if (loadingInterval) {
        log('clearing load() interval', { interval })
        clearInterval(loadingInterval)
      }

      log('unmounting data hook')

      isMountedRef.current = false
    }

    if (!idExplicitlyPassed || (idExplicitlyPassed && id !== undefined)) {
      // bail if no longer mounted
      if (!isMounted || (loadOnlyOnce && loadedOnce)) {
        return exit
      }

      autoload && load()

      if (interval) {
        var loadingInterval = setInterval(load, interval)
      }
    }

    return exit
  }, [id])

  let loadFunction = eventable(load)

  return {
    data,
    filtered: meta.filtered,
    load: loadFunction,
    refresh: loadFunction,
    create,
    remove,
    update,
    replace,
    isLoading: meta.isLoading,
    error: meta.error,
    key: meta.key,
  }
}
