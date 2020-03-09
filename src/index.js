import { useEffect, useRef, useState } from 'react'
import useStore from 'use-store'
import { fetchAxios, objectFilter, autoResolve, autoReject, getPatch, FetchStore } from './lib'

const LOG_PREFIX = '[react-data-hooks]: '
const HASH_PREFIX = 'rdh:'

// helper function to assemble endpoint parts, joined by '/', but removes undefined attributes
const getEndpoint = (...parts) => parts.filter(p => p !== undefined).join('/')

// generates a unique hash for component render-busting via <Component key={someUniqueKey} />
const getHash = () => ({ key: Math.floor(Math.random() * 1e12) })

// converts a value or function into the corresponding value
const functionOrValue = fnv => {
  const value = typeof fnv === 'function' ? fnv() : fnv

  if (typeof fnv !== 'undefined' && !['string', 'number'].includes(typeof value)) {
    console.log('throwing on', { fnv, value, type: typeof fnv })
    throw new TypeError('"namespace" option must be a string, number, or function that returns one of those')
  }

  return value || ''
}

// no-op for logging
const noop = () => {}

// localStorage-clearing function
export const clearStore = (namespace, undefinedAllowed = true) => {
  if (namespace === undefined && !undefinedAllowed) {
    throw new TypeError('"namespace" option must be set when using clearStore() to prevent over-aggressive clearing')
  }

  let pattern = HASH_PREFIX + (namespace ? namespace + ':' : '')

  // console.log('clearing store with pattern', pattern, 'from localStorage', Object.keys(localStorage))

  Object.keys(localStorage)
    .filter(key => key.indexOf(pattern) !== -1)
    .forEach(key => {
      // console.log('removing store entry', key)
      localStorage.removeItem(key)
    })
  // .forEach(key => console.log('testing', key, ' => ', pattern.test(key)))
}

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
    mergeOnCreate = true,
    mergeOnUpdate = true,
    mock,
    namespace, // string, number, or function that returns one
    onAuthenticationError,
    onCreate = () => {},
    onError = console.error,
    onLoad = () => {},
    onRemove = () => {},
    onReplace = () => {},
    onUpdate = () => {},
    query = {},
    transform,
    transformCollection,
    transformItem,
  } = options

  let isCollectionExplicitlySet = options.hasOwnProperty('isCollection')
  let isFixedEndpoint = isCollection === false
  var loadingInterval

  // allow { log: true } alias as well as routing to custom loggers
  log = log === true ? (...args) => console.log.apply(null, [LOG_PREFIX, ...args]) : log || noop

  if (axios !== fetchAxios) {
    log('using custom axios', axios)
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

  let key =
    HASH_PREFIX +
    functionOrValue(namespace) +
    ':' +
    getEndpoint(endpoint, (!isCollection && (id || ':id')) || undefined, queryKey)

  let [data, setData] = useStore(key, initialValue, options)
  let [meta, setMeta] = useState({
    isLoading: autoload,
    hasLoaded: false,
    filtered: initialValue,
    error: undefined,
    key: getHash(),
  })
  let prevFetchConfig = undefined

  const logAndSetMeta = createLogAndSetMeta({ log, setMeta })

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

          let updated = mergeOnUpdate ? { ...item, ...newData } : item

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

          return updated
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

      return item
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
  const load = (...loadArgs) => {
    let [loadId, loadOptions] = loadArgs
    let idPassed = loadArgs.length && typeof loadArgs[0] !== 'object'

    if (typeof loadId === 'object' && loadOptions === undefined) {
      // e.g. useHook({ something })
      loadOptions = loadId // use first param as options
      loadId = undefined
    }
    loadOptions = loadOptions || {}

    let opt = { ...options, ...loadOptions }
    let { query, fetchOptions } = opt
    let fetchEndpoint = getEndpoint(endpoint, loadId || id)

    // if query param is a function, run it to derive up-to-date params
    query = typeof query === 'function' ? query() : query

    log('GET', { endpoint: fetchEndpoint, query })

    isMounted &&
      logAndSetMeta({
        ...meta,
        isLoading: true,
        error: undefined,
      })

    return fetchStore
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
            if (isCollection && Array.isArray(data)) {
              data = data.map(transformItem)
            } else {
              data = transformItem(data)
            }
            log('AFTER transformItem:', data)
          }

          if (isMounted) {
            setData(data)

            logAndSetMeta({
              ...meta,
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

        return data
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
    let { hasLoaded } = meta

    if (idExplicitlyPassed) {
      log('id changed:', id)
    }

    log('loading check', { autoload, id, idExplicitlyPassed, isMounted, hasLoaded, loadOnlyOnce })

    if (!idExplicitlyPassed || (idExplicitlyPassed && id !== undefined)) {
      // bail if no longer mounted
      if (!isMounted || (loadOnlyOnce && hasLoaded)) {
        log('skipping load', { isMounted, loadOnlyOnce, hasLoaded })
      } else {
        autoload && load()

        if (interval && !loadingInterval) {
          log('adding load interval', interval)

          loadingInterval = setInterval(load, interval)
        }
      }
    }

    if (idExplicitlyPassed && id === undefined && data !== initialValue) {
      setData(initialValue)
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
    clearStore: () => clearStore(namespace, false),
    data,
    load: loadFunction,
    refresh: loadFunction,
    create,
    remove,
    update,
    replace,
    ...meta,
  }
}
