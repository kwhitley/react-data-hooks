import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../../src'
import { randomItem } from 'supergeneric/collections'
import { getCollectionEndpoint, getItemEndpoint, MockApi } from '../../__mocks__/fetch'
import { extractHook, example, type, defaults } from './index'
import { example1 } from '../examples'

export const setup = () => {
  var suppressError = { onError: () => {} }
  var endpoint = getCollectionEndpoint()
  var useCollection = createRestHook(endpoint)
  var api = new MockApi()
  var collection = api.get()
  var item = randomItem(collection)
  var itemEndpoint = `${endpoint}/${item.id}`
  var useItem = createRestHook(itemEndpoint, { isCollection: false })
  var updated = { ...item, foo: 'bar' }
  var newItem = { foo: 'bar' }
  var postResponse = api.post(newItem)

  fetchMock.getOnce(endpoint, api.get())
  fetchMock.getOnce(itemEndpoint, item)
  fetchMock.patchOnce(itemEndpoint, updated)
  fetchMock.putOnce(itemEndpoint, updated)
  fetchMock.deleteOnce(itemEndpoint, 200)
  fetchMock.postOnce(endpoint, postResponse, newItem)

  return {
    endpoint,
    collection,
    useCollection,
    api,
    item,
    itemEndpoint,
    newItem,
    useItem,
    updated,
    suppressError,
    postResponse,
    onCreate: jest.fn(),
    onRemove: jest.fn(),
    onUpdate: jest.fn(),
    onReplace: jest.fn(),
    onLoad: jest.fn(),
    onError: jest.fn(),
    onAuthenticationError: jest.fn(),
    fn: jest.fn(),
  }
}
