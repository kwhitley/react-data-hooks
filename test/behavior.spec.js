import 'whatwg-fetch'
import { example1 } from './examples'
import * as returns from './returns'

describe('BEHAVIOR' + example1, () => {
  describe('RETURN from instantiated hook...', () => {
    returns.create()
    returns.data()
    returns.error()
    returns.isLoading()
    returns.key()
    returns.load()
    returns.refresh()
    returns.remove()
    returns.replace()
    returns.update()
  })
})

//   describe('OPTIONS', () => {
//     describe('autoload' + type('boolean') + defaults('true'), () => {
//       it('loads data from endpoint immediately with default of { autoload: true }', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection())
//         await pause()
//         compare('data', collection)
//       })

//       it('does not autoload if { autoload: false }', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
//         compare('isLoading', false)
//       })
//     })

//     describe('filter' + type('function or object') + defaults('undefined'), () => {
//       it('filtered returns the original data array if no filter set', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection())
//         await pause()
//         compare('filtered', api.get())
//       })

//       it(`filtered can use a filter function (e.g. { filter: item => !item.flag })`, async () => {
//         let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
//         fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
//         const { hook, compare, pause } = extractHook(() => useCollection({ filter: i => i.flag }))
//         await pause()
//         compare('filtered', flaggedFeed.filter(i => i.flag))
//       })

//       it('filtered can use a filter object (e.g. { filter: { flag: false } })', async () => {
//         let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
//         fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
//         const { hook, compare, pause } = extractHook(() => useCollection({ filter: { flag: true } }))
//         await pause()
//         compare('filtered', flaggedFeed.filter(i => i.flag))
//       })
//     })

//     describe('initialValue' + type('anything') + defaults('[] if collection, undefined if not'), () => {
//       it(`data defaults to initialValue if set (e.g. { initialValue: 'foo' })`, async () => {
//         expect(true).toBe(true) // functionality tested elsewhere
//       })
//     })

//     describe('interval' + type('number (ms)') + defaults('undefined'), () => {
//       it('allows polling of data via GET/load() at time = {interval}', async () => {
//         const onLoad = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onLoad, interval: 5 }))
//         await pause()
//         await pause()
//         await pause()
//         expect(onLoad).toHaveBeenCalledTimes(3)
//       })
//     })

//     // detect collection option effect by monitoring default data
//     describe('isCollection' + type('boolean') + defaults('true if no ID, false otherwise'), () => {
//       it('defaults to true for endpoints without ID (data = [])', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
//         compare('data', [])
//       })

//       it('defaults to false for endpoints without ID (data = undefined)', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection('foo', { autoload: false }))
//         compare('data', undefined)
//       })

//       it('allows fixed endpoints with { isCollection: false } (data = undefined)', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, isCollection: false }))
//         compare('data', undefined)
//       })
//     })

//     // detect collection option effect by monitoring default data
//     describe('log' + type('boolean or function') + defaults('empty function'), () => {
//       it('logging is turned off by default', async () => {
//         let originalLog = window.console.log
//         let log = (window.console.log = jest.fn())
//         const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
//         expect(log).not.toHaveBeenCalled()
//         window.console.log = originalLog
//       })

//       it('uses console.log if { log: true }', async () => {
//         let originalLog = window.console.log
//         let log = (window.console.log = jest.fn())
//         const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, log: true }))
//         expect(log).toHaveBeenCalled()
//         window.console.log = originalLog
//       })

//       it('can accept any function to handle log (e.g. { log: console.info })', async () => {
//         const log = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, log }))
//         expect(log).toHaveBeenCalled()
//       })
//     })

//     describe('onAuthenticationError({ message, status? })' + type('function') + defaults('undefined'), () => {
//       it('fires when receiving a 401 from GET or load()', async () => {
//         fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
//         const onAuthenticationError = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError: () => {} }))
//         await pause()
//         expect(onAuthenticationError).toHaveBeenCalled()
//       })

//       it('fires when receiving a 403 from GET or load()', async () => {
//         fetchMock.getOnce(endpoint, 403, { overwriteRoutes: true })
//         const onAuthenticationError = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError: () => {} }))
//         await pause()
//         expect(onAuthenticationError).toHaveBeenCalled()
//       })

//       it('does not fire onError() on 401/403 if onAuthenticationError() defined', async () => {
//         fetchMock.getOnce(endpoint, 403, { overwriteRoutes: true })
//         const onAuthenticationError = jest.fn()
//         const onError = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError }))
//         await pause()
//         expect(onAuthenticationError).toHaveBeenCalled()
//         expect(onError).not.toHaveBeenCalled()
//       })
//     })

//     describe('onCreate(item)' + type('function') + defaults('undefined'), () => {
//       it('fired when items created via POST', async () => {
//         expect(true).toBe(true) // functionality tested elsewhere
//       })
//     })

//     describe('onError({ message, status? })' + type('function') + defaults('console.log'), () => {
//       it('throws error if passed an ID when option { isCollection: false }', async () => {
//         expect(() => useCollection(12, { isCollection: false })).toThrow()
//       })

//       it('returned error obj toString() === err.message', async () => {
//         fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
//         const onError = jest.fn(err => err.toString())
//         const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
//         await pause()
//         expect(onError).toHaveReturnedWith('Error: Unauthorized')
//       })

//       it('containst status code for response errors', async () => {
//         fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
//         const onError = jest.fn(err => err.status)
//         const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
//         await pause()
//         expect(onError).toHaveReturnedWith(401)
//       })

//       it('containst no status code for try/catch errors', async () => {
//         const onError = jest.fn(err => err.status)
//         const { hook, compare, pause } = extractHook(() => useCollection({ transform: d => d.will.break, onError }))
//         await pause()
//         expect(onError).toHaveBeenCalled()
//         expect(onError).toHaveReturnedWith(undefined)
//       })

//       it('sets error prop and calls onError() with transform error', async () => {
//         const onError = jest.fn()
//         const { hook, compare, pause } = extractHook(() =>
//           useCollection({
//             transform: d => d.will.break,
//             onError,
//           })
//         )
//         expect(hook().error).toBeUndefined()
//         await pause()
//         expect(hook().error).not.toBeUndefined()
//         expect(onError).toHaveBeenCalled()
//       })

//       it('sets error prop and calls onError() with response status error', async () => {
//         fetchMock.getOnce(endpoint, 404, { overwriteRoutes: true })
//         const onError = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
//         expect(hook().error).toBeUndefined()
//         await pause()
//         expect(hook().error).not.toBeUndefined()
//         expect(hook().error.message).toBe('Not Found')
//         expect(onError).toHaveBeenCalled()
//       })

//       it('sets calls onError() with 401/403 errors if onAuthenticationError() not defined', async () => {
//         fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
//         const onError = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
//         await pause()
//         expect(onError).toHaveBeenCalled()
//       })

//       it('intercepts and prevents other success events (e.g. onUpdate, onCreate, onReplace, etc)', async () => {
//         const onLoad = jest.fn()
//         const onError = jest.fn()
//         const onUpdate = jest.fn()
//         fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
//         fetchMock.patchOnce(itemEndpoint, 401, { overwriteRoutes: true })

//         const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate, onError, onLoad }))
//         await pause()
//         expect(onError).toHaveBeenCalled()
//         expect(onLoad).not.toHaveBeenCalled()

//         act(() => {
//           hook().update(updated, item)
//         })
//         await pause()
//         expect(onError).toHaveBeenCalledTimes(2)
//         expect(onUpdate).not.toHaveBeenCalled()
//       })
//     })

//     describe('onLoad(item)' + type('function') + defaults('undefined'), () => {
//       it('fired when data fetched via GET', async () => {
//         expect(true).toBe(true) // functionality tested elsewhere
//       })
//     })

//     describe('onRemove(item)' + type('function') + defaults('undefined'), () => {
//       it('fired when items removed via DELETE', async () => {
//         expect(true).toBe(true) // functionality tested elsewhere
//       })
//     })

//     describe('onReplace(item)' + type('function') + defaults('undefined'), () => {
//       it('fired when items replaced via PUT', async () => {
//         expect(true).toBe(true) // functionality tested elsewhere
//       })
//     })

//     describe('onUpdate(item)' + type('function') + defaults('undefined'), () => {
//       it('fired when items updated via PATCH', async () => {
//         expect(true).toBe(true) // functionality tested elsewhere
//       })
//     })

//     describe('query' + type('function or object') + defaults('undefined'), () => {
//       it(`appends dynamic query to GET endpoint if function (e.g. { query: () => ({ limit: 1 }) })`, async () => {
//         let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
//         fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
//         const { hook, compare, pause } = extractHook(() => useCollection({ query: () => ({ limit: 1 }) }))
//         await pause()
//         compare('data', flaggedFeed)
//       })

//       it(`appends static query to GET endpoint if object (e.g. { query: { limit: 1 } })`, async () => {
//         let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
//         fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
//         const { hook, compare, pause } = extractHook(() => useCollection({ query: { limit: 1 } }))
//         await pause()
//         compare('data', flaggedFeed)
//       })
//     })

//     describe('transform' + type('function') + defaults('undefined'), () => {
//       it('transform reshapes payload (e.g. { transform: r => r.data })', async () => {
//         fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
//         const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
//         await pause()
//         compare('data', api.get())
//       })

//       it('transform reshapes PATCH payload', async () => {
//         fetchMock.patchOnce(itemEndpoint, { data: updated }, { overwriteRoutes: true })
//         fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
//         const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
//         await pause()
//         act(() => {
//           hook().update({ ...item, foo: 'bar' }, item)
//         })
//         await pause()
//         compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
//       })
//     })

//     describe('transformCollection' + type('function') + defaults('undefined'), () => {
//       it('transformCollection reshapes collection on GET (e.g. { transformCollection: c => c.slice(0,1) })', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection({ transformCollection: c => c.slice(0, 1) }))
//         await pause()
//         compare('data', collection.slice(0, 1))
//       })

//       it('fires after transform() if defined', async () => {
//         fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
//         const { hook, compare, pause } = extractHook(() =>
//           useCollection({
//             transform: r => r.data,
//             transformCollection: c => c.slice(0, 1),
//           })
//         )
//         await pause()
//         compare('data', collection.slice(0, 1))
//       })
//     })

//     describe('transformItem' + type('function') + defaults('undefined'), () => {
//       const transformItem = item => ({ ...item, transformed: true })
//       const transformCollection = c => c.slice(0, 1)

//       it('transformItem reshapes each item within collection on GET (e.g. { transformItem: item => ({ ...item, isCool: true }) })', async () => {
//         const { hook, compare, pause } = extractHook(() => useCollection({ transformItem }))
//         await pause()
//         compare('data', collection.map(transformItem))
//       })

//       it('transformItem reshapes data on GET with item endpoint', async () => {
//         const { hook, compare, pause } = extractHook(() => useItem({ transformItem }))
//         await pause()
//         compare('data', transformItem(item))
//       })

//       it('fires after transform() and transformCollection() if defined (on collection endpoints)', async () => {
//         fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
//         const { hook, compare, pause } = extractHook(() =>
//           useCollection({
//             transform: r => r.data,
//             transformCollection,
//             transformItem,
//           })
//         )
//         await pause()
//         compare('data', transformCollection(collection).map(transformItem))
//       })

//       it('transforms data on operations (e.g. PATCH)', async () => {
//         const onUpdate = jest.fn()
//         const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate }))
//         await pause()
//         compare('data', collection)
//         act(() => {
//           hook().update(updated, item)
//         })
//         await pause()
//         compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
//         expect(onUpdate).toHaveBeenCalled()
//       })
//     })
//   })
// })
