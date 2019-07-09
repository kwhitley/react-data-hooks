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

export const createRestHook = (endpoint, createHookOptions = {}) => (...args) => {
  let [ id, hookOptions ] = args
  let isCollection = false

  // for collections, clear id, and derive options from first param
  if (typeof id === 'object' || !args.length) {
    hookOptions = id
    id = undefined
    isCollection = true
  }

  // local options are a blend of factory options and instantiation options
  let options = deepmerge(createHookOptions, hookOptions || {})

  // extract options
  let {
    transform,
    getId,
    initialValue,
    filter,
    mock,
    interval,
    log,
    query = {},
    axios = defaultAxios,
    autoload = true,
  } = options

  // getId(item) is used to derive the endpoint for update/delete/replace actions
  getId = getId || (item => item.id)

  // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)
  initialValue = initialValue || (isCollection ? [] : undefined)

  let key = 'datahook:' + endpoint + JSON.stringify(args)
  let [ data, setData ] = useStore(key, initialValue, options)
  let [ isLoading, setIsLoading ] = useState(false)
  let [ error, setError ] = useState(undefined)

  const handleError = (error) => {
    log && log('handleError executed')
    setIsLoading(false)
    setError(error)
    throw new Error(error)
  }

  // data load function
  const loadData = (loadDataOptions = {}) => {
    let opt = deepmerge(options, loadDataOptions)
    let { query, transform } = opt

    // if query param is a function, run it to derive up-to-date params
    query = typeof query === 'function' ? query() : query

    log && log({ endpoint, query })

    // only lock with loading when not pre-populated
    !isLoading && setIsLoading(true)

    error && setError(undefined)

    axios
      .get(getEndpoint(endpoint, id), { params: query })
      .then(({ data }) => {
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

        setData(data)
        setIsLoading(false)
      })
      .catch(handleError)
  }

  // automatically load data upon component load and set up intervals, if defined
  useEffect(() => {
    var loadingInterval

    if (id || isCollection) {
      if (autoload) {
        loadData()
      }

      if (interval) {
        loadingInterval = setInterval(loadData, interval)
      }
    }

    return () => {
      if (loadingInterval) {
        log && log('clearing loadData() interval', { interval })
        clearInterval(loadingInterval)
      }
    }
  }, [])

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

    setIsLoading(true)

    const resolve = () => {
      setIsLoading(false)

      // short circuit for non-collection calls
      if (!isCollection) {
        log && log(`non-collection action ${actionType}: setting data to`, item)
        return setData(item)
      }

      let newData = data

      if (['update', 'replace'].includes(actionType)) {
        log && log('updating item in internal collection')
        newData = data.map(i => getId(i) === itemId ? item : i)
      } else if (actionType === 'create') {
        log && log('adding item to internal collection')
        newData = [...data, item]
      } else if (actionType === 'delete') {
        log && log('deleting item from internal collection')
        newData = data.filter(i => i !== item)
      }

      // update internal data
      setData(newData)
    }

    // mock exit for success
    if (mock) {
      log && log(`mock ${actionType}`, getEndpoint(endpoint, itemId), payload)
      return autoResolve('Success!', { fn: resolve })
    }

    return axios[method](getEndpoint(endpoint, itemId), payload)
      .then(resolve)
      .catch(handleError)
  }

  const updateAction = createActionType({ actionType: 'update', method: 'patch' })
  const replaceAction = createActionType({ actionType: 'replace', method: 'put' })
  const deleteAction = createActionType({ actionType: 'delete', method: 'delete' })
  const createAction = createActionType({ actionType: 'create', method: 'post' })

  return {
    data,
    collectionName: options.collectionName,
    itemName: options.itemName,
    setData,
    loadData,
    refresh: loadData,
    createAction,
    deleteAction,
    updateAction,
    replaceAction,
    isLoading,
    error,
  }
}
