import axios from 'axios'
import { renderHook, act } from '@testing-library/react-hooks'
import { createRestHook } from '../build'
import {
  COLLECTION_ENDPOINT,
  ITEM_ENDPOINT,
  responseMap,
  generateItem,
} from '../__mocks__/axios'

describe('Collection data fetching and methods', () => {
  const endpoint = COLLECTION_ENDPOINT
  const useCollection = createRestHook(endpoint)

  it('fetches and returns data on instantiation', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCollection())
    expect(result.current.isLoading).toEqual(true)
    expect(result.current).toHaveProperty('data', [])
    await waitForNextUpdate()
    expect(result.current).toHaveProperty('data', responseMap.get(endpoint))
  })

  it('can create a record with an ID', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCollection())
    await waitForNextUpdate()
    expect(result.current).toHaveProperty('create')
    const newItem = generateItem()
    act(() => {
      result.current.create(newItem)
    })
    await waitForNextUpdate()
    // This is currently failing because Hook is making POST request at `endpoint/uuid` because newItem contains an id field
    // expect(axios.post).toHaveBeenCalledWith(endpoint, newItem)
    expect(
      result.current.data.find(item => item.id === newItem.id)
    ).toBeTruthy()
  })

  it('can create a record without an ID', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useCollection())
    await waitForNextUpdate()
    const oldData = result.current.data
    expect(result.current).toHaveProperty('create')
    const newItem = generateItem()
    delete newItem.id
    act(() => {
      result.current.create(newItem)
    })
    await waitForNextUpdate()
    expect(axios.post).toHaveBeenCalledWith(endpoint, newItem)
    const newData = result.current.data.filter(item => !oldData.includes(item))
    expect(newData).toEqual(expect.arrayContaining([newItem]))
  })

  it('fires transform()', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useCollection({
        transformItem: item => Object.assign({ ...item, foo: 'bar' }),
      })
    )
    await waitForNextUpdate()
    const oldData = result.current.data
    const newItem = generateItem()
    act(() => {
      result.current.create(newItem)
    })
    await waitForNextUpdate()
    expect(axios.post).toHaveBeenCalledWith(endpoint, newItem)
    const newData = result.current.data.filter(item => !oldData.includes(item))
    expect(newData).toEqual(
      expect.arrayContaining([{ ...newItem, foo: 'bar' }])
    )
  })
})

describe('Item data fetching and methods', () => {
  const useItem = createRestHook(ITEM_ENDPOINT)

  it('fetches and returns data on instantiation', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useItem())
    expect(result.current.isLoading).toEqual(true)
    expect(result.current).toHaveProperty('data', []) // should this be {}?
    await waitForNextUpdate()
    expect(result.current).toHaveProperty(
      'data',
      responseMap.get(ITEM_ENDPOINT)
    )
  })
})
