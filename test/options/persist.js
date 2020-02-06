// import 'whatwg-fetch'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

beforeEach(() => {
  localStorage.clear()
})

export const persist = () =>
  describe('persist' + type('boolean') + defaults('false'), () => {
    it('will save response data to localStorage', async () => {
      const { useCollection, api } = setup()
      const { rerender, hook, compare, pause } = extractHook(() => useCollection({ persist: true }))
      await pause()
      expect(Object.keys(localStorage.__STORE__).length).toBe(1)
    })
  })
