import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

beforeEach(() => {
  localStorage.clear()
})

export const clearStore = () =>
  describe('clearStore()' + type('function'), () => {
    it('will throw if "namespace" option not set when called', async () => {
      const { useCollection, api } = setup()
      const { rerender, hook, compare, pause } = extractHook(() => useCollection({ persist: true }))
      await pause()
      // expect(Object.keys(localStorage.__STORE__).length).toBe(1)
      act(() => {
        expect(() => hook().clearStore()).toThrow()
      })
      // expect(Object.keys(localStorage.__STORE__).length).toBe(0)
    })

    it('will only clear own namespace [and only own namespace]', async () => {
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
      act(() => {
        hook().clearStore()
      })
      expect(Object.keys(localStorage.__STORE__).length).toBe(2)
    })
  })
