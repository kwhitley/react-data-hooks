import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../src'
import { randomItem } from 'supergeneric/collections'
import { getCollectionEndpoint, getItemEndpoint, MockApi } from '../__mocks__/fetch'
import { extractHook, example, type, defaults } from './lib'
import { example1 } from './examples'

const compare = hook => expect(hook.current).toHaveProperty

describe('BEHAVIOR' + example1, () => {
  var endpoint
  var api
  var useCollection
  var useItem
  var collection
  var item
  var itemEndpoint
  var updated
  const suppressError = { onError: () => {} }

  beforeEach(() => {
    endpoint = getCollectionEndpoint()
    useCollection = createRestHook(endpoint)
    api = new MockApi()
    collection = api.get()
    item = randomItem(collection)
    itemEndpoint = `${endpoint}/${item.id}`
    useItem = createRestHook(itemEndpoint, { isCollection: false })
    updated = { ...item, foo: 'bar' }

    fetchMock.getOnce(endpoint, api.get())
    fetchMock.getOnce(itemEndpoint, item)
    fetchMock.patchOnce(itemEndpoint, updated)
    fetchMock.putOnce(itemEndpoint, updated)
    fetchMock.deleteOnce(itemEndpoint, 200)
  })

  describe('RETURN from instantiated hook...', () => {
    describe('create(item)' + type('function'), () => {
      it('sends POST, updates internal collection, and fires onCreate(item) when used with collection hook', async () => {
        let onCreate = jest.fn()
        let newItem = { foo: 'bar' }
        let postResponse = api.post(newItem)
        fetchMock.postOnce(endpoint, postResponse, newItem)
        const { hook, compare, pause } = extractHook(() => useCollection({ onCreate }))
        await pause()
        compare('data', collection)
        act(() => {
          hook().create(newItem)
        })
        await pause()
        compare('data', [...collection, postResponse])
        expect(onCreate).toHaveBeenCalled()
      })
    })

    describe('data' + type('empty array (if collection) or undefined (if item)'), () => {
      it('default of { autoload: true } loads data from endpoint immediately', async () => {
        expect(true).toBe(true) // functionality tested with option:autoload
      })

      it('does not autoload if { autoload: false }', async () => {
        expect(true).toBe(true) // functionality tested with option:autoload
      })

      it('data defaults to [] if no ID passed and { isCollection: false } not set', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('data', [])
      })

      it('data defaults to undefined if item hook { isCollection: false }', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ isCollection: false, autoload: false }))
        compare('data', undefined)
      })

      it(`data defaults to undefined if string identifier passed to collection hook (e.g. useHook('foo'))`, async () => {
        const { hook, compare, pause } = extractHook(() => useCollection('foo', { autoload: false }))
        compare('data', undefined)
      })

      it(`data defaults to undefined if numeric identifier passed to collection hook (e.g. useHook(123))`, async () => {
        const { hook, compare, pause } = extractHook(() => useCollection(123, { autoload: false }))
        compare('data', undefined)
      })

      it(`data defaults to initialValue if set (e.g. { initialValue: 'foo' })`, async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, initialValue: 'foo' }))
        compare('data', 'foo')
      })
    })

    describe('error' + type('undefined or error object { message, status?, ...other }') + defaults('undefined'), () => {
      it('is undefined by default', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('error', undefined)
      })

      it(`contains a message (e.g. { message: 'Foo' }) when thrown via try/catch`, async () => {
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transform: d => d.will.fail,
            ...suppressError,
          })
        )
        await pause()
        expect(hook().error.message).not.toBe(undefined)
      })

      it(`contains a message and status (e.g. { message: 'Not Found', status: 400 }) when thrown via response error`, async () => {
        fetchMock.getOnce(endpoint, 404, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transform: d => d.will.fail,
            ...suppressError,
          })
        )
        await pause()
        expect(hook().error.message).toBe('Not Found')
        expect(hook().error.status).toBe(404)
      })

      it('is caught by transform() errors', async () => {
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transform: d => d.will.fail,
            ...suppressError,
          })
        )
        await pause()
        expect(hook().error).not.toBe(undefined)
      })

      it('is caught by transformCollection() errors', async () => {
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transformCollection: d => d.will.fail,
            ...suppressError,
          })
        )
        await pause()
        expect(hook().error).not.toBe(undefined)
      })

      it('is caught by transformItem() errors', async () => {
        const { hook, compare, pause } = extractHook(() =>
          useItem({
            transformItem: d => d.will.fail,
            ...suppressError,
          })
        )
        await pause()
        expect(hook().error).not.toBe(undefined)
      })
    })

    describe('isLoading' + type('boolean') + defaults('false until loading'), () => {
      it('is false before loading data', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('isLoading', false)
      })
    })

    describe('key' + type('object') + defaults('{ key: 20245568110 }'), () => {
      it('returns hash object in the following format... { key: 134123041 } for render-busting (e.g. <Component {...key} />)', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        const key = hook().key
        expect(hook().key).toHaveProperty('key')
        expect(typeof hook().key.key).toBe('number')
      })

      it('returns new key after basic GET', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection())
        const key = hook().key
        await pause()
        expect(hook().key).not.toBe(key)
      })

      it('returns new key after operations (e.g. PATCH)', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection())
        await pause()
        const key = hook().key
        act(() => {
          hook().update(updated, item)
        })
        await pause()
        expect(hook().key).not.toBe(key)
      })
    })

    describe('load(options = {})' + type('function'), () => {
      it('allows manual loading via the load() function', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('data', [])
        act(() => {
          hook().load()
        })
        await pause()
        compare('data', api.get())
      })
    })

    describe('refresh(options = {})' + type('function'), () => {
      it('is an alias of load() function', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        expect(hook().load).toStrictEqual(hook().refresh)
      })
    })

    describe('remove(item)' + type('function'), () => {
      it('sends DELETE, updates internal collection, and fires onRemove(item) when used with collection hook', async () => {
        const onRemove = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onRemove }))
        await pause()
        compare('data', collection)
        act(() => {
          hook().remove(item)
        })
        await pause()
        compare('data', collection.filter(i => i.id !== item.id))
        expect(onRemove).toHaveBeenCalled()
      })

      it('sends DELETE, clears self, and fires onRemove(item) when used with item hook', async () => {
        const onRemove = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onRemove }))
        await pause()
        compare('data', item)
        act(() => {
          hook().remove(item)
        })
        await pause()
        compare('data', undefined)
        expect(onRemove).toHaveBeenCalled()
      })

      it('sends DELETE, clears self, and calls onRemove(item) from item hook { isCollection: false }', async () => {
        const onRemove = jest.fn()
        const { hook, compare, pause } = extractHook(() => useItem({ onRemove }))
        await pause()
        compare('data', item)
        act(() => {
          hook().remove(item)
        })
        await pause()
        compare('data', undefined)
        expect(onRemove).toHaveBeenCalled()
      })
    })

    describe('replace(item, oldItem)' + type('function'), () => {
      it('sends PUT, updates internal collection, and fires onReplace(item) when used with collection hook', async () => {
        const onReplace = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onReplace }))
        await pause()
        compare('data', collection)
        act(() => {
          hook().replace({ ...item, foo: 'bar' }, item)
        })
        await pause()
        compare('data', collection.map(i => (i.id !== item.id ? i : { ...i, ...updated })))
        expect(onReplace).toHaveBeenCalled()
      })

      it('sends PUT, updates internal collection, and fires onReplace(item) when used with item hook', async () => {
        const onReplace = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onReplace }))
        await pause()
        compare('data', item)
        act(() => {
          hook().replace(updated, item)
        })
        await pause()
        compare('data', updated)
        expect(onReplace).toHaveBeenCalled()
      })

      it('sends PUT, replaces self, and calls onReplace(item) from item hook { isCollection: false }', async () => {
        const onReplace = jest.fn()
        const { hook, compare, pause } = extractHook(() => useItem({ onReplace }))
        await pause()
        compare('data', item)
        act(() => {
          hook().replace(updated, item)
        })
        await pause()
        compare('data', updated)
        expect(onReplace).toHaveBeenCalled()
      })
    })

    describe('update(item|changes, oldItem)' + type('function'), () => {
      it('sends PATCH, updates internal collection, and fires onUpdate(item) when used with collection hook', async () => {
        const onUpdate = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate }))
        await pause()
        compare('data', collection)
        act(() => {
          hook().update(updated, item)
        })
        await pause()
        compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
        expect(onUpdate).toHaveBeenCalled()
      })

      it('sends PATCH and updates self when used with item hook', async () => {
        const onUpdate = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onUpdate }))
        await pause()
        compare('data', item)
        act(() => {
          hook().update(updated, item)
        })
        await pause()
        compare('data', updated)
        expect(onUpdate).toHaveBeenCalled()
      })

      it('sends PATCH, updates self, and calls onUpdate(item) from item hook { isCollection: false }', async () => {
        const onUpdate = jest.fn()
        const { hook, compare, pause } = extractHook(() => useItem({ onUpdate }))
        await pause()
        compare('data', item)
        act(() => {
          hook().update(updated, item)
        })
        await pause()
        expect(onUpdate).toHaveBeenCalled()
      })
    })
  })

  describe('OPTIONS', () => {
    describe('autoload' + type('boolean') + defaults('true'), () => {
      it('loads data from endpoint immediately with default of { autoload: true }', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection())
        await pause()
        compare('data', collection)
      })

      it('does not autoload if { autoload: false }', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('isLoading', false)
      })
    })

    describe('filter' + type('function or object') + defaults('undefined'), () => {
      it('filtered returns the original data array if no filter set', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection())
        await pause()
        compare('filtered', api.get())
      })

      it(`filtered can use a filter function (e.g. { filter: item => !item.flag })`, async () => {
        let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
        fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() => useCollection({ filter: i => i.flag }))
        await pause()
        compare('filtered', flaggedFeed.filter(i => i.flag))
      })

      it('filtered can use a filter object (e.g. { filter: { flag: false } })', async () => {
        let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
        fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() => useCollection({ filter: { flag: true } }))
        await pause()
        compare('filtered', flaggedFeed.filter(i => i.flag))
      })
    })

    describe('initialValue' + type('anything') + defaults('[] if collection, undefined if not'), () => {
      it(`data defaults to initialValue if set (e.g. { initialValue: 'foo' })`, async () => {
        expect(true).toBe(true) // functionality tested elsewhere
      })
    })

    describe('interval' + type('number (ms)') + defaults('undefined'), () => {
      it('allows polling of data via GET/load() at time = {interval}', async () => {
        const onLoad = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onLoad, interval: 5 }))
        await pause()
        await pause()
        await pause()
        expect(onLoad).toHaveBeenCalledTimes(3)
      })
    })

    // detect collection option effect by monitoring default data
    describe('isCollection' + type('boolean') + defaults('true if no ID, false otherwise'), () => {
      it('defaults to true for endpoints without ID (data = [])', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('data', [])
      })

      it('defaults to false for endpoints without ID (data = undefined)', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection('foo', { autoload: false }))
        compare('data', undefined)
      })

      it('allows fixed endpoints with { isCollection: false } (data = undefined)', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, isCollection: false }))
        compare('data', undefined)
      })
    })

    // detect collection option effect by monitoring default data
    describe('log' + type('boolean or function') + defaults('empty function'), () => {
      it('logging is turned off by default', async () => {
        let originalLog = window.console.log
        let log = (window.console.log = jest.fn())
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        expect(log).not.toHaveBeenCalled()
        window.console.log = originalLog
      })

      it('uses console.log if { log: true }', async () => {
        let originalLog = window.console.log
        let log = (window.console.log = jest.fn())
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, log: true }))
        expect(log).toHaveBeenCalled()
        window.console.log = originalLog
      })

      it('can accept any function to handle log (e.g. { log: console.info })', async () => {
        const log = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, log }))
        expect(log).toHaveBeenCalled()
      })
    })

    describe('onAuthenticationError({ message, status? })' + type('function') + defaults('undefined'), () => {
      it('fires when receiving a 401 from GET or load()', async () => {
        fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
        const onAuthenticationError = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError: () => {} }))
        await pause()
        expect(onAuthenticationError).toHaveBeenCalled()
      })

      it('fires when receiving a 403 from GET or load()', async () => {
        fetchMock.getOnce(endpoint, 403, { overwriteRoutes: true })
        const onAuthenticationError = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError: () => {} }))
        await pause()
        expect(onAuthenticationError).toHaveBeenCalled()
      })

      it('does not fire onError() on 401/403 if onAuthenticationError() defined', async () => {
        fetchMock.getOnce(endpoint, 403, { overwriteRoutes: true })
        const onAuthenticationError = jest.fn()
        const onError = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError }))
        await pause()
        expect(onAuthenticationError).toHaveBeenCalled()
        expect(onError).not.toHaveBeenCalled()
      })
    })

    describe('onCreate(item)' + type('function') + defaults('undefined'), () => {
      it('fired when items created via POST', async () => {
        expect(true).toBe(true) // functionality tested elsewhere
      })
    })

    describe('onError({ message, status? })' + type('function') + defaults('console.log'), () => {
      it('throws error if passed an ID when option { isCollection: false }', async () => {
        expect(() => useCollection(12, { isCollection: false })).toThrow()
      })

      it('returned error obj toString() === err.message', async () => {
        fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
        const onError = jest.fn(err => err.toString())
        const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
        await pause()
        expect(onError).toHaveReturnedWith('Error: Unauthorized')
      })

      it('containst status code for response errors', async () => {
        fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
        const onError = jest.fn(err => err.status)
        const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
        await pause()
        expect(onError).toHaveReturnedWith(401)
      })

      it('containst no status code for try/catch errors', async () => {
        const onError = jest.fn(err => err.status)
        const { hook, compare, pause } = extractHook(() => useCollection({ transform: d => d.will.break, onError }))
        await pause()
        expect(onError).toHaveBeenCalled()
        expect(onError).toHaveReturnedWith(undefined)
      })

      it('sets error prop and calls onError() with transform error', async () => {
        const onError = jest.fn()
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transform: d => d.will.break,
            onError,
          })
        )
        expect(hook().error).toBeUndefined()
        await pause()
        expect(hook().error).not.toBeUndefined()
        expect(onError).toHaveBeenCalled()
      })

      it('sets error prop and calls onError() with response status error', async () => {
        fetchMock.getOnce(endpoint, 404, { overwriteRoutes: true })
        const onError = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
        expect(hook().error).toBeUndefined()
        await pause()
        expect(hook().error).not.toBeUndefined()
        expect(hook().error.message).toBe('Not Found')
        expect(onError).toHaveBeenCalled()
      })

      it('sets calls onError() with 401/403 errors if onAuthenticationError() not defined', async () => {
        fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
        const onError = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
        await pause()
        expect(onError).toHaveBeenCalled()
      })

      it('intercepts and prevents other success events (e.g. onUpdate, onCreate, onReplace, etc)', async () => {
        const onLoad = jest.fn()
        const onError = jest.fn()
        const onUpdate = jest.fn()
        fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
        fetchMock.patchOnce(itemEndpoint, 401, { overwriteRoutes: true })

        const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate, onError, onLoad }))
        await pause()
        expect(onError).toHaveBeenCalled()
        expect(onLoad).not.toHaveBeenCalled()

        act(() => {
          hook().update(updated, item)
        })
        await pause()
        expect(onError).toHaveBeenCalledTimes(2)
        expect(onUpdate).not.toHaveBeenCalled()
      })
    })

    describe('onLoad(item)' + type('function') + defaults('undefined'), () => {
      it('fired when data fetched via GET', async () => {
        expect(true).toBe(true) // functionality tested elsewhere
      })
    })

    describe('onRemove(item)' + type('function') + defaults('undefined'), () => {
      it('fired when items removed via DELETE', async () => {
        expect(true).toBe(true) // functionality tested elsewhere
      })
    })

    describe('onReplace(item)' + type('function') + defaults('undefined'), () => {
      it('fired when items replaced via PUT', async () => {
        expect(true).toBe(true) // functionality tested elsewhere
      })
    })

    describe('onUpdate(item)' + type('function') + defaults('undefined'), () => {
      it('fired when items updated via PATCH', async () => {
        expect(true).toBe(true) // functionality tested elsewhere
      })
    })

    describe('query' + type('function or object') + defaults('undefined'), () => {
      it(`appends dynamic query to GET endpoint if function (e.g. { query: () => ({ limit: 1 }) })`, async () => {
        let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
        fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
        const { hook, compare, pause } = extractHook(() => useCollection({ query: () => ({ limit: 1 }) }))
        await pause()
        compare('data', flaggedFeed)
      })

      it(`appends static query to GET endpoint if object (e.g. { query: { limit: 1 } })`, async () => {
        let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
        fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
        const { hook, compare, pause } = extractHook(() => useCollection({ query: { limit: 1 } }))
        await pause()
        compare('data', flaggedFeed)
      })
    })

    describe('transform' + type('function') + defaults('undefined'), () => {
      it('transform reshapes payload (e.g. { transform: r => r.data })', async () => {
        fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
        await pause()
        compare('data', api.get())
      })

      it('transform reshapes PATCH payload', async () => {
        fetchMock.patchOnce(itemEndpoint, { data: updated }, { overwriteRoutes: true })
        fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
        await pause()
        act(() => {
          hook().update({ ...item, foo: 'bar' }, item)
        })
        await pause()
        compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
      })
    })

    describe('transformCollection' + type('function') + defaults('undefined'), () => {
      it('transformCollection reshapes collection on GET (e.g. { transformCollection: c => c.slice(0,1) })', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ transformCollection: c => c.slice(0, 1) }))
        await pause()
        compare('data', collection.slice(0, 1))
      })

      it('fires after transform() if defined', async () => {
        fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transform: r => r.data,
            transformCollection: c => c.slice(0, 1),
          })
        )
        await pause()
        compare('data', collection.slice(0, 1))
      })
    })

    describe('transformItem' + type('function') + defaults('undefined'), () => {
      const transformItem = item => ({ ...item, transformed: true })
      const transformCollection = c => c.slice(0, 1)

      it('transformItem reshapes each item within collection on GET (e.g. { transformItem: item => ({ ...item, isCool: true }) })', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ transformItem }))
        await pause()
        compare('data', collection.map(transformItem))
      })

      it('transformItem reshapes data on GET with item endpoint', async () => {
        const { hook, compare, pause } = extractHook(() => useItem({ transformItem }))
        await pause()
        compare('data', transformItem(item))
      })

      it('fires after transform() and transformCollection() if defined (on collection endpoints)', async () => {
        fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() =>
          useCollection({
            transform: r => r.data,
            transformCollection,
            transformItem,
          })
        )
        await pause()
        compare('data', transformCollection(collection).map(transformItem))
      })

      it('transforms data on operations (e.g. PATCH)', async () => {
        const onUpdate = jest.fn()
        const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate }))
        await pause()
        compare('data', collection)
        act(() => {
          hook().update(updated, item)
        })
        await pause()
        compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
        expect(onUpdate).toHaveBeenCalled()
      })
    })
  })
})
