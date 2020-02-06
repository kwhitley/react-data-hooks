import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { clearStore as exportClearStore } from '../src'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from './lib'

beforeEach(() => {
  localStorage.clear()
})

export const clearStore = () =>
  describe('clearStore(namespace?)' + type('function'), () => {
    it('will clear all data hook entries if called with no namespace (e.g. clearStore())', async () => {
      const { useCollection, useItem, api } = setup()
      const otherCollection = extractHook(() => useCollection({ persist: true }))
      const otherItem = extractHook(() => useItem({ persist: true }))
      const { rerender, hook, compare, pause } = extractHook(() =>
        useCollection({
          persist: true,
          namespace: 'foo',
        })
      )
      await pause()
      expect(Object.keys(localStorage.__STORE__).length).toBe(3)
      exportClearStore()
      expect(Object.keys(localStorage.__STORE__).length).toBe(0)
    })

    it('can clear specific namespace entries', async () => {
      localStorage.setItem('other', 'should remain')
      const { useCollection, useItem, api } = setup()
      const otherCollection = extractHook(() => useCollection({ persist: true }))
      const otherItem = extractHook(() => useItem({ persist: true }))
      const { rerender, hook, compare, pause } = extractHook(() =>
        useCollection({
          persist: true,
          namespace: 'foo',
        })
      )
      await pause()
      expect(Object.keys(localStorage.__STORE__).length).toBe(4)
      exportClearStore('foo')
      expect(Object.keys(localStorage.__STORE__).length).toBe(3)
    })

    it('will ONLY clear data hook entries from localStorage', async () => {
      localStorage.setItem('other', 'should remain')
      const { useCollection, useItem, api } = setup()
      const otherCollection = extractHook(() => useCollection({ persist: true }))
      const otherItem = extractHook(() => useItem({ persist: true }))
      const { rerender, hook, compare, pause } = extractHook(() =>
        useCollection({
          persist: true,
          namespace: 'foo',
        })
      )
      await pause()
      expect(Object.keys(localStorage.__STORE__).length).toBe(4)
      exportClearStore()
      expect(Object.keys(localStorage.__STORE__).length).toBe(1)
    })
  })
