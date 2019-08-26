import { useState, useEffect } from 'react'
import { useStore } from 'use-store-hook'
import defaultAxios from 'axios'
import deepmerge from 'deepmerge'
import { objectFilter, autoResolve, autoReject, getPatch } from './utils'

// helper function to assemble endpoint parts, joined by '/', but removes undefined attributes
const getEndpoint = (...parts) => parts.filter(p => p !== undefined).join('/')

// helper function to handle functions that may be passed a DOM event
const eventable = fn => (...args) => {
  let arg0 = args[0] || {}
  if (arg0.nativeEvent instanceof Event) {
    return fn()
  }

  return fn(...args)
}

export const createRestHook = (endpoint, createHookOptions = {}) => (
  ...args
) => {
  let [id, hookOptions] = args
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
    log = () => {},
    onAuthenticationError = () => {},
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
    transform = v => v,
    transformCollection = v => v,
    transformItem = v => v,
  } = options

  // if isCollection not explicitly set, try to derive from arguments
  if (!options.hasOwnProperty('isCollection')) {
    // for collections, clear id, and derive options from first param
    if (idExplicitlyPassed) {
      // e.g. useHook('foo') useHook(3)
      isCollection = false
    } else {
      isCollection = true
    }
  }

  // allow { log: true } alias as well as routing to custom loggers
  log = log === true ? console.log : log

  // log('creating hook', {
  //   endpoint,
  //   id,
  //   idExplicitlyPassed,
  //   isCollection,
  //   options,
  //   args,
  // })

  // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)
  initialValue = options.hasOwnProperty('initialValue')
    ? initialValue
    : isCollection
    ? []
    : undefined

  let key = 'resthook:' + endpoint + JSON.stringify(args)
  let [data, setData] = useStore(key, initialValue, options)
  let [isLoading, setIsLoading] = useState(autoload)
  let [error, setError] = useState(undefined)

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
    onError(error) // event

    // handle authentication errors
    if (onAuthenticationError && [401, 403].includes(status)) {
      onAuthenticationError(error)
    }
  }

  const createActionType = (actionOptions = {}) => (item, oldItem) => {
    let itemId = id || getId(item)
    let { actionType = 'update', method = 'patch' } = actionOptions
    let payload = undefined

    log(actionType.toUpperCase(), 'on', item, 'with id', itemId)
    if (!itemId && actionType !== 'create') {
      return autoReject(`Could not ${actionType} item (see log)`, {
        fn: () => {
          console.error('option.getId(item) did not return a valid ID', item)
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

    isMounted && setIsLoading(true)

    const resolve = response => {
      try {
        isMounted && setIsLoading(false)

        let newData = transform(response.data)
        log('AFTER transform:', newData)

        // if collection, transform as collection
        newData = transformItem(newData)
        log('AFTER transformItem:', newData)

        // short circuit for non-collection calls
        if (!isCollection) {
          log(`non-collection action ${actionType}: setting data to`, item)
          if (actionType === 'remove') {
            return isMounted && setData()
          }

          let updated = mergeOnUpdate ? deepmerge(item, newData) : item

          onUpdate(updated) // event

          return isMounted && setData(updated)
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
      .catch(err => handleError(err.response))
  }

  const update = createActionType({ actionType: 'update', method: 'patch' })
  const replace = createActionType({ actionType: 'replace', method: 'put' })
  const remove = createActionType({ actionType: 'remove', method: 'delete' })
  const create = createActionType({ actionType: 'create', method: 'post' })

  // data load function
  const load = (loadOptions = {}) => {
    let opt = deepmerge(options, loadOptions)
    let { query } = opt

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
          log('GET RESPONSE:', data)

          // all data gets base transform
          data = transform(data)
          log('AFTER transform:', data)

          // if collection, transform as collection
          data = isCollection ? transformCollection(data) : transformItem(data)
          log(`AFTER transform${isCollection ? 'Collection' : 'Item'}:`, data)

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
          onError(err) // event
          isMounted && setError(err.message)
        }
      })
      .catch(err => {
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
