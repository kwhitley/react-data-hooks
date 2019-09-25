import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../src'
import { randomItem } from 'supergeneric/collections'
import { getCollectionEndpoint, getItemEndpoint, MockApi } from '../__mocks__/fetch'
import { extractHook, example, type, defaults } from './lib'
import { example1 } from './examples'

const setup = () => {
  var suppressError = { onError: () => {} }
  var endpoint = getCollectionEndpoint()
  var useCollection = createRestHook(endpoint)
  var api = new MockApi()
  var collection = api.get()
  var item = randomItem(collection)
  var itemEndpoint = `${endpoint}/${item.id}`
  var useItem = createRestHook(itemEndpoint, { isCollection: false })
  var updated = { ...item, foo: 'bar' }

  fetchMock.getOnce(endpoint, api.get())
  fetchMock.getOnce(itemEndpoint, item)
  fetchMock.patchOnce(itemEndpoint, updated)
  fetchMock.putOnce(itemEndpoint, updated)
  fetchMock.deleteOnce(itemEndpoint, 200)

  return {
    endpoint,
    collection,
    useCollection,
    api,
    item,
    itemEndpoint,
    useItem,
    updated,
    suppressError,
  }
}

describe('BEHAVIOR' + example1, () => {
  // var endpoint
  // var api
  // var useCollection
  // var useItem
  // var collection
  // var item
  // var itemEndpoint
  // var updated
  // var suppressError = { onError: () => {} }

  // beforeEach(() => {
  //   endpoint = getCollectionEndpoint()
  //   useCollection = createRestHook(endpoint)
  //   api = new MockApi()
  //   collection = api.get()
  //   item = randomItem(collection)
  //   itemEndpoint = `${endpoint}/${item.id}`
  //   useItem = createRestHook(itemEndpoint, { isCollection: false })
  //   updated = { ...item, foo: 'bar' }

  //   fetchMock.getOnce(endpoint, api.get())
  //   fetchMock.getOnce(itemEndpoint, item)
  //   fetchMock.patchOnce(itemEndpoint, updated)
  //   fetchMock.putOnce(itemEndpoint, updated)
  //   fetchMock.deleteOnce(itemEndpoint, 200)
  // })

  describe('RETURN from instantiated hook...', () => {
    describe('create(item)' + type('function'), () => {
      it('sends POST, updates internal collection, and fires onCreate(item) when used with collection hook', async () => {
        let { useCollection, api, endpoint, collection } = setup()
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
  })
})
