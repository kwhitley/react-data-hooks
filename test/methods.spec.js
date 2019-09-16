import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../build'
import {
  getCollectionEndpoint,
  getItemEndpoint,
  responseMap,
  generateItem,
  MockApi,
} from '../__mocks__/fetch'

describe('Collection data fetching and methods', () => {
  var endpoint
  var api
  var useCollection

  beforeEach(() => {
    endpoint = getCollectionEndpoint()
    useCollection = createRestHook(endpoint)
    api = new MockApi()
  })

  it('data defaults to empty array', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCollection())
    expect(result.current.isLoading).toEqual(true)
    expect(result.current).toHaveProperty('data', [])
  })

  it('autoloads by default', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCollection())
    expect(result.current.isLoading).toEqual(true)
  })

  it('does not autoload if { autoload: false }', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useCollection({ autoload: false })
    )
    expect(result.current.isLoading).toEqual(false)
  })

  it('fetches and returns data on instantiation', async () => {
    let expectedResponse = api.get()
    fetchMock.getOnce(endpoint, expectedResponse)

    const { result, waitForNextUpdate } = renderHook(() => useCollection())
    expect(result.current.isLoading).toEqual(true)
    expect(result.current).toHaveProperty('data', [])
    await waitForNextUpdate()
    expect(result.current.isLoading).toEqual(false)
    expect(result.current).toHaveProperty('data', expectedResponse)
  })

  // it('can create a record with an ID', async () => {
  //   const { result, waitForNextUpdate } = renderHook(() => useCollection())
  //   await waitForNextUpdate()
  //   expect(result.current).toHaveProperty('create')
  //   const newItem = generateItem()
  //   act(() => {
  //     result.current.create(newItem)
  //   })
  //   await waitForNextUpdate()
  //   // This is currently failing because Hook is making POST request at `endpoint/uuid` because newItem contains an id field
  //   // expect(axios.post).toHaveBeenCalledWith(endpoint, newItem)
  //   expect(
  //     result.current.data.find(item => item.id === newItem.id)
  //   ).toBeTruthy()
  // })

  //   it('can create a record without an ID', async () => {
  //     const { result, waitForNextUpdate } = renderHook(() => useCollection())
  //     await waitForNextUpdate()
  //     const oldData = result.current.data
  //     expect(result.current).toHaveProperty('create')
  //     const newItem = generateItem()
  //     delete newItem.id
  //     act(() => {
  //       result.current.create(newItem)
  //     })
  //     await waitForNextUpdate()
  //     // expect(axios.post).toHaveBeenCalledWith(endpoint, newItem)
  //     const newData = result.current.data.filter(item => !oldData.includes(item))
  //     expect(newData).toEqual(expect.arrayContaining([newItem]))
  //   })

  //   it('fires transform()', async () => {
  //     const { result, waitForNextUpdate } = renderHook(() =>
  //       useCollection({
  //         transformItem: item => Object.assign({ ...item, foo: 'bar' }),
  //       })
  //     )
  //     await waitForNextUpdate()
  //     const oldData = result.current.data
  //     const newItem = generateItem()
  //     act(() => {
  //       result.current.create(newItem)
  //     })
  //     await waitForNextUpdate()
  //     // expect(axios.post).toHaveBeenCalledWith(endpoint, newItem)
  //     const newData = result.current.data.filter(item => !oldData.includes(item))
  //     expect(newData).toEqual(
  //       expect.arrayContaining([{ ...newItem, foo: 'bar' }])
  //     )
  //   })
  // })

  // describe('Item data fetching and methods', () => {
  //   const useItem = createRestHook(ITEM_ENDPOINT)

  //   it('fetches and returns data on instantiation', async () => {
  //     const { result, waitForNextUpdate } = renderHook(() => useItem())
  //     expect(result.current.isLoading).toEqual(true)
  //     expect(result.current).toHaveProperty('data', []) // should this be {}?
  //     await waitForNextUpdate()
  //     expect(result.current).toHaveProperty(
  //       'data',
  //       responseMap.get(ITEM_ENDPOINT)
  //     )
  //   })
})
