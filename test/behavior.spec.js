import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../src'
import { randomItem } from 'supergeneric/collections'
import { getCollectionEndpoint, getItemEndpoint, MockApi } from '../__mocks__/fetch'
import { extractHook } from './lib/extract-hook'
import chalk from 'chalk'

const compare = hook => expect(hook.current).toHaveProperty

const example = (code = '', options = {}) => {
  let { spaces = 6 } = options
  let indent = Array(spaces)
    .fill(' ')
    .join('')

  return (
    chalk.magentaBright(`\n${indent}Example:\n`) + chalk.magenta(`${indent}${code.replace(/[\r\n]/gi, '\n' + indent)}`)
  )
}

const type = (which = 'object') => chalk.yellow(` as ${which}`)

describe('BEHAVIOR', () => {
  var endpoint
  var api
  var useCollection
  var useItem
  var collection
  var item
  var itemEndpoint

  beforeEach(() => {
    endpoint = getCollectionEndpoint()
    useCollection = createRestHook(endpoint)
    api = new MockApi()
    collection = api.get()
    item = randomItem(collection)
    itemEndpoint = `${endpoint}/${item.id}`
    useItem = createRestHook(itemEndpoint, { isCollection: false })

    fetchMock.getOnce(endpoint, api.get())
    fetchMock.getOnce(itemEndpoint, item)
  })

  const exampleCode = `const useKittens = createRestHook('/api/kittens')

function MyReactComponent() {
  const { data: kittens, isLoading } = useKittens() // get the basic collection
  const { data: mittens } = useKittens('mittens') // this would load a single item from '/api/kittens/mittens'
  const { data: manualKittens, load } = useKittens({ autoload: false }) // this would wait to load until load() has been fired elsewhere

  return (
    isLoading
    ? <p>Still loading data...</p>
    : <div>{ JSON.stringify(kittens, null, 2)}</div>
  )
}`

  describe('RETURN from instantiated hook...' + example(exampleCode), () => {
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

    describe('isLoading' + type('boolean'), () => {
      it('is false before loading data', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('isLoading', false)
      })
    })

    describe('key' + type('object'), () => {
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
        fetchMock.patchOnce(itemEndpoint, {})
        await pause()
        const key = hook().key
        act(() => {
          hook().update({ ...item, foo: 'bar' }, item)
        })
        await pause()
        expect(hook().key).not.toBe(key)
      })
    })

    describe('load(options = {})' + type('function'), () => {
      it('default of { autoload: true } loads data from endpoint immediately', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection())
        await pause()
        compare('data', collection)
      })

      it('does not autoload if { autoload: false }', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('isLoading', false)
      })

      it('allows manual loading via the load() function', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('data', [])
        act(() => {
          hook().load()
        })
        await pause()
        compare('data', api.get())
      })

      it('data defaults to [] if no ID passed and { isCollection: false } not set', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        compare('data', [])
      })

      it('data defaults to { initialValue: something } if set', async () => {
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, initialValue: 'foo' }))
        compare('data', 'foo')
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
    })

    describe('remove(item)' + type('function'), () => {
      it('sends DELETE, updates internal collection, and fires onRemove(item) when used with collection hook', async () => {
        const onRemove = jest.fn()
        fetchMock.deleteOnce(itemEndpoint, 200)
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
        fetchMock.deleteOnce(itemEndpoint, 200)
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
        fetchMock.deleteOnce(itemEndpoint, 200)
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
        const updated = { id: item.id, foo: 'bar' }
        fetchMock.putOnce(itemEndpoint, updated)
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
        const updated = { id: item.id, foo: 'bar' }
        fetchMock.putOnce(itemEndpoint, updated)
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
        const updated = { id: item.id, foo: 'bar' }
        fetchMock.putOnce(itemEndpoint, updated)
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
        const updated = { ...item, foo: 'bar' }
        fetchMock.patchOnce(itemEndpoint, updated)

        const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate }))
        await pause()
        compare('data', collection)
        act(() => {
          hook().update({ ...item, foo: 'bar' }, item)
        })
        await pause()
        compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
        expect(onUpdate).toHaveBeenCalled()
      })

      it('sends PATCH and updates self when used with item hook', async () => {
        const onUpdate = jest.fn()
        const updated = { ...item, foo: 'bar' }
        fetchMock.patchOnce(itemEndpoint, updated)

        const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onUpdate }))
        await pause()
        compare('data', item)
        act(() => {
          hook().update({ ...item, foo: 'bar' }, item)
        })
        await pause()
        compare('data', updated)
        expect(onUpdate).toHaveBeenCalled()
      })

      it('sends PATCH, updates self, and calls onUpdate(item) from item hook { isCollection: false }', async () => {
        const onUpdate = jest.fn()
        const updated = { ...item, foo: 'bar' }
        fetchMock.patchOnce(itemEndpoint, updated)

        const { hook, compare, pause } = extractHook(() => useItem({ onUpdate }))
        await pause()
        compare('data', item)
        act(() => {
          hook().update({ ...item, foo: 'bar' }, item)
        })
        await pause()
        expect(onUpdate).toHaveBeenCalled()
      })
    })
  })

  describe('errors', () => {
    it('throws and calls onError() if passed an ID when option { isCollection: false }', async () => {
      const onError = jest.fn()
      expect(() =>
        useCollection(12, {
          isCollection: false,
          onError,
        })
      ).toThrow()

      expect(onError).toHaveBeenCalled()
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
  })

  describe('OPTIONS', () => {
    describe('filter' + type('function or object'), () => {
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

    describe('query' + type('function or object'), () => {
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

    describe('transform' + type('function'), () => {
      it('transform reshapes payload (e.g. { transform: r => r.data })', async () => {
        fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
        await pause()
        compare('data', api.get())
      })

      it('transform reshapes PATCH payload', async () => {
        const updated = { ...item, foo: 'bar' }
        fetchMock.patchOnce(itemEndpoint, { data: updated })
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
  })
})
