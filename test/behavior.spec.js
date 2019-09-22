import 'whatwg-fetch'
import axios from 'axios'
import fetchMock from 'fetch-mock'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../src'
import { randomItem } from 'supergeneric/collections'
import {
  getCollectionEndpoint,
  getItemEndpoint,
  responseMap,
  generateItem,
  MockApi,
} from '../__mocks__/fetch'
import { extractHook } from './lib/extract-hook'

const compare = hook => expect(hook.current).toHaveProperty

describe('BEHAVIOR', () => {
  var endpoint
  var api
  var useCollection
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

    fetchMock.getOnce(endpoint, api.get())
  })

  describe('loading data', () => {
    it('autoloads by default', async () => {
      const { hook, compare, pause } = extractHook(() => useCollection())

      compare('isLoading', true)
      await pause()
    })

    it('does not autoload if { autoload: false }', async () => {
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ autoload: false })
      )

      compare('isLoading', false)
    })

    it('allows manual loading via the load() function', async () => {
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ autload: false })
      )

      compare('data', [])

      act(() => {
        hook().load()
      })

      await pause()
      compare('data', api.get())
    })
  })

  describe('collection vs. item', () => {
    it('assumes collection by default (data defaults to [])', async () => {
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ autoload: false })
      )
      compare('data', [])
    })

    it('data defaults to undefined if { isCollection: false }', async () => {
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ isCollection: false, autoload: false })
      )
      compare('data', undefined)
    })

    it(`data defaults to undefined if string identifier passed (e.g. useHook('foo'))`, async () => {
      const { hook, compare, pause } = extractHook(() =>
        useCollection('foo', { autoload: false })
      )
      compare('data', undefined)
    })

    it(`data defaults to undefined if numeric identifier passed (e.g. useHook(123))`, async () => {
      const { hook, compare, pause } = extractHook(() =>
        useCollection(123, { autoload: false })
      )
      compare('data', undefined)
    })
  })

  describe('CRUD functions', () => {
    it('fetches and returns (GET) data on instantiation', async () => {
      let expectedResponse = api.get()
      const { hook, compare, pause } = extractHook(() => useCollection())

      compare('isLoading', true)
      compare('data', [])
      await pause()
      compare('isLoading', false)
      compare('data', expectedResponse)
    })

    it('can create an item (POST) with the collection endpoint', async () => {
      let newItem = { foo: 'bar' }
      let postResponse = api.post(newItem)
      fetchMock.postOnce(endpoint, postResponse, newItem)

      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()
      compare('data', collection)

      act(() => {
        hook().create(newItem)
      })

      await pause()
      compare('data', [...collection, postResponse])
    })

    it('can update (PATCH) an item to the collection endpoint', async () => {
      const updated = { ...item, foo: 'bar' }

      fetchMock.patchOnce(itemEndpoint, updated)

      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()
      compare('data', collection)

      act(() => {
        hook().update({ ...item, foo: 'bar' }, item)
      })

      await pause()
      compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
    })

    it('can replace (PUT) an item to the collection endpoint', async () => {
      const updated = { id: item.id, foo: 'bar' }

      fetchMock.putOnce(itemEndpoint, updated)

      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()
      compare('data', collection)

      act(() => {
        hook().replace({ ...item, foo: 'bar' }, item)
      })

      await pause()
      compare(
        'data',
        collection.map(i => (i.id !== item.id ? i : { ...i, ...updated }))
      )
    })

    it('can remove (DELETE) an item to the collection endpoint', async () => {
      fetchMock.deleteOnce(itemEndpoint, 200)

      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()

      act(() => {
        hook().remove(item)
      })

      await pause()
      compare('data', collection.filter(i => i.id !== item.id))
    })
  })

  describe('errors', () => {
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
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ onError })
      )
      expect(hook().error).toBeUndefined()

      await pause()
      expect(hook().error).not.toBeUndefined()
      expect(hook().error.message).toBe('Not Found')
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('filtering', () => {
    it('filtered returns the original data array if no filter set', async () => {
      const { hook, compare, pause } = extractHook(() => useCollection())

      await pause()
      compare('filtered', api.get())
    })

    it(`filtered can use a filter function (e.g. { filter: item => !item.flag })`, async () => {
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ filter: i => i.flag })
      )

      await pause()
      compare('filtered', flaggedFeed.filter(i => i.flag))
    })

    it('filtered can use a filter object (e.g. { filter: { flag: false } })', async () => {
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ filter: { flag: true } })
      )

      await pause()
      compare('filtered', flaggedFeed.filter(i => i.flag))
    })
  })

  describe('transforming', () => {
    it('transform reshapes payload (e.g. { transform: r => r.data })', async () => {
      fetchMock.getOnce(
        endpoint,
        { data: api.get() },
        { overwriteRoutes: true }
      )
      const { hook, compare, pause } = extractHook(() =>
        useCollection({ transform: r => r.data })
      )

      await pause()
      compare('data', api.get())
    })

    it('transform reshapes PATCH payload', async () => {
      const updated = { ...item, foo: 'bar' }
      fetchMock.patchOnce(itemEndpoint, { data: updated })
      fetchMock.getOnce(
        endpoint,
        { data: api.get() },
        { overwriteRoutes: true }
      )

      const { hook, compare, pause } = extractHook(() =>
        useCollection({ transform: r => r.data })
      )
      await pause()

      act(() => {
        hook().update({ ...item, foo: 'bar' }, item)
      })

      await pause()
      compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
    })
  })
})
