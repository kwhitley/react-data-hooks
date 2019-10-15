import { useState, useEffect, useRef } from 'react'
import useStore from 'use-store'
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

// instantiate shared fetch pool for GET requests
const fetchStore = new FetchStore()

const createLogAndSetMeta = ({ log, setState }) => newState => {
  log('setting state', newState)
  setState(newState)
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

  hookOptions = hookOptions || {}

  // local options are a blend of factory options and instantiation options
  let options = { ...createHookOptions, ...hookOptions }

  // extract options
  let {
    autoload = true,
    axios = fetchAxios,
    fetchOptions = {},
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
  var loadingInterval

  // allow { log: true } alias as well as routing to custom loggers
  log = log === true ? console.log : log || (() => {})

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

  let [state, setState] = useStore(
    key,
    {
      data: initialValue,
      filtered: initialValue,
      isLoading: autoload,
      hasLoaded: false,
      error: undefined,
      key: getHash(),
    },
    options
  )

  let prevFetchConfig = undefined

  const logAndSetState = createLogAndSetMeta({ log, setState })

  const handleError = (error = {}) => {
    var errorObj

    if (typeof error === 'object') {
      var { msg, message, data, body, status, statusText } = error

      var errorMessage = msg || message || statusText
      var errorBody = data || body || {}

      if (!status && Number(errorMessage)) {
        status = Number(errorMessage)
        errorMessage = undefined
      }

      errorObj = new Error(errorMessage)
      errorObj.msg = errorMessage
      errorObj.status = status
      Object.keys(errorBody).forEach(key => (errorObj[key] = errorBody[key]))
    } else {
      errorObj = new Error(error)
    }

    log(`${LOG_PREFIX} handleError executed`, { errorObj })

    isMounted &&
      logAndSetState({
        ...state,
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
      logAndSetState({
        ...state,
        isLoading: true,
      })

    const resolve = response => {
      try {
        let data = state.data
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
            onRemove(state.data)
            return (
              isMounted &&
              setState({
                ...state,
                data: undefined,
              })
            )
          }

          let updated = mergeOnUpdate ? { ...item, ...newData } : item

          actionType === 'replace' && onReplace(updated) // event
          actionType === 'update' && onUpdate(updated) // event

          isMounted &&
            logAndSetState({
              ...state,
              data: updated,
              isLoading: false,
              error: undefined,
              key: getHash(),
            })

          return true
        }

        if (['update', 'replace'].includes(actionType)) {
          item = mergeOnUpdate ? { ...item, ...newData } : item

          log('updating item in internal collection', item)
          newData = data.map(i => (getId(i) === itemId ? item : i))

          actionType === 'replace' && onReplace(item) // event
          actionType === 'update' && onUpdate(item) // event
        } else if (actionType === 'create') {
          item = mergeOnCreate ? { ...item, ...newData } : item

          log('adding item to internal collection', item)
          newData = [...data, item]

          onCreate(item) // event
        } else if (actionType === 'remove') {
          log('deleting item from internal collection')
          newData = data.filter(i => getId(i) !== itemId)

          onRemove(item) // event
        }

        // update internal data
        isMounted &&
          logAndSetState({
            ...state,
            data: newData,
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

    return axios[method](getEndpoint(endpoint, itemId), payload, fetchOptions)
      .then(resolve)
      .catch(err => handleError(err.response || err))
  }

  const update = createActionType({ actionType: 'update', method: 'patch' })
  const replace = createActionType({ actionType: 'replace', method: 'put' })
  const remove = createActionType({ actionType: 'remove', method: 'delete' })
  const create = createActionType({ actionType: 'create', method: 'post' })

  // data load function
  const load = (loadOptions = {}) => {
    let opt = { ...options, ...loadOptions }
    let { query, loadOnlyOnce } = opt
    let fetchEndpoint = getEndpoint(endpoint, id)

    // if query param is a function, run it to derive up-to-date params
    query = typeof query === 'function' ? query() : query

    log('GET', { endpoint: fetchEndpoint, query })

    isMounted &&
      logAndSetState({
        ...state,
        isLoading: true,
        error: undefined,
      })

    fetchStore
      .get(fetchEndpoint, { params: query }, fetchOptions)
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
            logAndSetState({
              ...state,
              data,
              hasLoaded: true,
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
    let data = state.data
    // complete avoid this useEffect pass when no filter set or not working on collection
    if (!filter || !isCollection || !Array.isArray(data)) {
      return () => {}
    }

    log('filter changed on datahook', [filter, data])
    var filtered = data
    var prev = state.filtered

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
        logAndSetState({
          ...state,
          filtered,
          key: getHash(),
        })
    }
  }, [filter, state.data])

  // EFFECT: SET INITIAL LOAD, LOADING INTERVAL, ETC
  useEffect(() => {
    if (idExplicitlyPassed) {
      log('react-use-rest: id changed:', id)
    }

    log('react-use-rest: loading check', {
      autoload,
      id,
      idExplicitlyPassed,
      isMounted,
      hasLoaded: state.hasLoaded,
      loadOnlyOnce,
    })

    if (!idExplicitlyPassed || (idExplicitlyPassed && id !== undefined)) {
      // bail if no longer mounted
      if (!isMounted || (loadOnlyOnce && state.hasLoaded)) {
        log('skipping load', { isMounted, loadOnlyOnce, hasLoaded: state.hasLoaded })
      } else {
        autoload && load()

        if (interval && !loadingInterval) {
          log('react-use-rest: adding load interval', interval)

          loadingInterval = setInterval(load, interval)
        }
      }
    }

    if (idExplicitlyPassed && id === undefined && state.data !== initialValue) {
      setState({
        ...state,
        data: initialValue,
      })
    }
  }, [id])

  // unmount procedure
  useEffect(() => {
    return () => {
      if (loadingInterval) {
        log('clearing load() interval', { interval })
        clearInterval(loadingInterval)
      }

      log('unmounting data hook')

      isMountedRef.current = false
    }
  }, [])

  let loadFunction = eventable(load)

  return {
    ...state,
    load: loadFunction,
    refresh: loadFunction,
    create,
    remove,
    update,
    replace,
  }
}
