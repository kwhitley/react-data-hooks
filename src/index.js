import { useState, useEffect } from 'react'
import { useStore } from 'use-store-hook'
import defaultAxios from 'axios'
import deepmerge from 'deepmerge'
import {
  objectFilter,
  autoResolve,
  autoReject,
  getPatch
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
  let isCollection = true
  let isMounted = true

  // for collections, clear id, and derive options from first param
  if (id !== undefined && typeof id !== 'object' && args.length) {
    // e.g. useHook('foo') useHook(3) useHook(undefined)
    isCollection = false
  } else if (id === undefined && args.length === 1) {
    isCollection = false
  } else if (hookOptions === undefined) {
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
    getId,
    initialValue,
    interval,
    log,
    mock,
    onError,
    query = {},
    transform,
  } = options

  // getId(item) is used to derive the endpoint for update/delete/replace actions
  getId = getId || (item => item.id)

  // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)
  initialValue = initialValue || (isCollection ? [] : undefined)

  let key = 'resthook:' + endpoint + JSON.stringify(args)
  let [ data, setData ] = useStore(key, initialValue, options)
  let [ isLoading, setIsLoading ] = useState(false)
  let [ error, setError ] = useState(undefined)

  const handleError = (error) => {
    log && log('handleError executed')
    isMounted && setIsLoading(false)
    isMounted && setError(error.message || error)
    onError && onError(error)
  }

  const createActionType = (actionOptions = {}) => (item, oldItem) => {
    let itemId = getId(item)
    let {
      actionType = 'update',
      method = 'patch',
    } = actionOptions
    let payload = undefined

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

    const resolve = () => {
      try {
        isMounted && setIsLoading(false)

        // short circuit for non-collection calls
        if (!isCollection) {
          log && log(`non-collection action ${actionType}: setting data to`, item)
          return isMounted && setData(item)
        }

        let newData = data

        if (['update', 'replace'].includes(actionType)) {
          log && log('updating item in internal collection')
          newData = data.map(i => getId(i) === itemId ? item : i)
        } else if (actionType === 'create') {
          log && log('adding item to internal collection')
          newData = [...data, item]
        } else if (actionType === 'remove') {
          log && log('deleting item from internal collection')
          newData = data.filter(i => i !== item)
        }

        // update internal data
        isMounted && setData(newData)
      } catch (err) {
        onError && onError(err)
        isMounted && setError(err.message)
      }
    }

    log && log(`calling "${method}" to`, getEndpoint(endpoint, itemId), payload)

    // mock exit for success
    if (mock) {
      return autoResolve('Success!', { fn: resolve })
    }

    return axios[method](getEndpoint(endpoint, itemId), payload)
      .then(resolve)
      .catch(handleError)
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

    log && log({ endpoint, query })

    // only lock with loading when not pre-populated
    !isLoading && isMounted && setIsLoading(true)

    error && isMounted && setError(undefined)

    axios
      .get(getEndpoint(endpoint, id), { params: query })
      .then(({ data }) => {
        try {
          log && log('payload data', data)
          // dig into nested payloads if required
          data = data.data || data

          if (transform) {
            data = transform(data)
          }

          if (filter) {
            if (typeof filter === 'function') {
              data = data.filter(filter)
            } else {
              data = data.filter(objectFilter(filter))
            }
          }

          isMounted && setData(data)
          isMounted && setIsLoading(false)
        } catch (err) {
          onError && onError(err)
          isMounted && setError(err.message)
        }
      })
      .catch(handleError)
  }

  // automatically load data upon component load and set up intervals, if defined
  useEffect(() => {
    var loadingInterval

    if (id || isCollection) {
      autoload && load()

      if (interval) {
        loadingInterval = setInterval(load, interval)
      }
    }

    return () => {
      if (loadingInterval) {
        log && log('clearing load() interval', { interval })
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
