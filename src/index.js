import { useState, useEffect } from 'react'
import { useStore } from 'use-store-hook'
import defaultAxios from 'axios'
import deepmerge from 'deepmerge'
import {
  objectFilter,
  autoResolve,
  autoReject,
  getPatch,
} from './utils'

// helper function to assemble endpoint parts, joined by '/', but removes undefined attributes
const getEndpoint = (...parts) => parts.filter(p => p !== undefined).join('/')

// helper function to handle functions that may be passed a DOM event
const eventable = (fn) => (...args) => {
  let arg0 = args[0] || {}
  if (arg0.nativeEvent instanceof Event) {
    return fn()
  }

  return fn(...args)
}

export const createRestHook = (endpoint, createHookOptions = {}) => (...args) => {
  let [ id, hookOptions ] = args
  let isMounted = true
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
    axios = defaultAxios,
    filter,
    getId = item => item.id, // handles the use-case of non-collections (will use id if present)
    initialValue,
    interval,
    isCollection,
    log = v => v,
    onAuthenticationError = () => {},
    onCreate = () => {},
    onError = () => {},
    onLoad = () => {},
    onRemove = () => {},
    onReplace = () => {},
    onUpdate = () => {},
    mergeOnCreate = true,
    mergeOnUpdate = true,
    mock,
    query = {},
    transform = v => v, // transforms all payloads (e.g. { response: { data: {} } })
    transformItem = v => v, // transforms any non-collection payload (e.g. return from PATCH)
    transformCollection = v => v, // transforms collection payload (e.g. return from GET without id)
  } = options

  // if isCollection not explicitly set, try to derive from arguments
  if (!options.hasOwnProperty('isCollection')) {
    isCollection = !idExplicitlyPassed
  }

  log('creating hook', { endpoint, id, idExplicitlyPassed, isCollection, options, args })

  // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)
  initialValue = options.hasOwnProperty('initialValue') ? initialValue : (isCollection ? [] : undefined)

  let key = 'resthook:' + endpoint + JSON.stringify(args)
  let [ data, setData ] = useStore(key, initialValue, options)
  let [ isLoading, setIsLoading ] = useState(autoload)
  let [ error, setError ] = useState(undefined)

  const handleError = (error = {}) => {
    if (typeof error === 'object') {
      var { message, status } = error

      if (error.response) {
        status = error.response.status
        message = error.response.data
      }
    }

    log('handleError executed', error)
    isMounted && setIsLoading(false)
    isMounted && setError(message || error)
    onError(error)

    // handle authentication errors
    if (onAuthenticati([401, 403]).includes(status)) {
      onAuthenticationError(error)
    }
  }

  const createActionType = (actionOptions = {}) => (item, oldItem) => {
    let itemId = id || getId(item)
    let {
      actionType = 'update',
      method = 'patch',
    } = actionOptions
    let payload = undefined

    console.log(actionType.toUpperCase(), 'on', item, 'with id', itemId)
    if (!itemId && actionType !== 'create') {
      return autoReject(`Could not ${actionType} item (see log)`, {
        fn: () => {
          console.error('option.getId(item) did not return a valid ID', item)
        }
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
    }

    isMounted && setIsLoading(true)

    const resolve = (response) => {
      try {
        isMounted && setIsLoading(false)

        let newData = data // set newData to current data set for collection operations
        let newDataItem = transformItem(transform(response.data)) // prefill item to transformed response

        // short circuit for non-collection hooks
        if (!isCollection) {
          let updated // define placeholder

          log(`non-collection action ${actionType}: setting data to`, item)

          if (actionType === 'remove') {
            return isMounted && setData()
          }

          if (actionType !== 'create') {
            newDataItem = mergeOnUpdate ? newDataItem : item // PUT, PATCH
            actionType === 'create' && onReplace(newDataItem)
          } else {
            newDataItem = mergeOnCreate ? newDataItem : item // POST

            actionType === 'replace' && onReplace(newDataItem)
            actionType === 'update' && onUpdate(newDataItem)
          }

          return isMounted && setData(newDataItem)
        }

        if (['update', 'replace'].includes(actionType)) {
          item = mergeOnUpdate ? newDataItem : item
          log('updating item in internal collection')
          newData = data.map(i => getId(i) === itemId ? item : i)

          actionType === 'replace' && onReplace(item)
          actionType === 'update' && onUpdate(item)
        } else if (actionType === 'create') {
          item = mergeOnCreate ? newDataItem : item
          log('adding item to internal collection')
          newData = [...data, item]

          onCreate(item)
        } else if (actionType === 'remove') {
          log('deleting item from internal collection')
          newData = data.filter(i => getId(i) !== itemId)

          onRemove(item)
        }

        // update internal collection data
        isMounted && setData(newData)
      } catch (err) {
        onError(err)
        isMounted && setError(err.message)
      }
    }

    log(`calling "${method}" to`, getEndpoint(endpoint, itemId), payload)

    // mock exit for success
    if (mock) {
      return autoResolve('Success!', { fn: resolve })
    }

    return axios[method](getEndpoint(endpoint, itemId), payload)
      .then(resolve)
      .catch((err) => handleError(err.response))
  }

  const update = createActionType({ actionType: 'update', method: 'patch' })
  const replace = createActionType({ actionType: 'replace', method: 'put' })
  const remove = createActionType({ actionType: 'remove', method: 'delete' })
  const create = createActionType({ actionType: 'create', method: 'post' })

  // data load function
  const load = (loadOptions = {}) => {
    let opt = deepmerge(options, loadOptions)
    let { query, transform } = opt

    // if query param is a function, run it to derive up-to-date params
    query = typeof query === 'function' ? query() : query

    log('GET', { endpoint, query })

    // only lock with loading when not pre-populated
    !isLoading && isMounted && setIsLoading(true)

    error && isMounted && setError(undefined)

    axios
      .get(getEndpoint(endpoint, id), { params: query })
      .then(({ data }) => {
        try {
          let data = transform(data) // transform payload

          data = isCollection
          ? transformCollection(data)
          : transformItem(data)

          if (filter) {
            if (typeof filter === 'function') {
              data = data.filter(filter)
            } else {
              data = data.filter(objectFilter(filter))
            }
          }

          if (isMounted) {
            setData(data)
            setIsLoading(false)
            onLoad(data)
          }
        } catch (err) {
          onError(err)
          isMounted && setError(err.message)
        }
      })
      .catch((err) => {
        handleError(err.response)
        setError(err.message)
        setData(initialValue)
      })
  }

  // automatically load data upon component load and set up intervals, if defined
  useEffect(() => {
    log('react-use-rest: [id] changed:', id)

    if (!idExplicitlyPassed || (idExplicitlyPassed && id !== undefined)) {
      autoload && load()

      if (interval) {
        var loadingInterval = setInterval(load, interval)
      }
    }

    return () => {
      if (loadingInterval) {
        log('clearing load() interval', { interval })
        clearInterval(loadingInterval)
      }

      isMounted = false
    }
  }, [id])

  return {
    data,
    setData,
    load: eventable(load),
    refresh: eventable(load),
    create,
    remove,
    update,
    replace,
    isLoading,
    error,
  }
}
