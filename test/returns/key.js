import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const key = () =>
  describe('key' + type('object') + defaults('{ key: 20245568110 }'), () => {
    it('returns hash object in the following format... { key: 134123041 } for render-busting (e.g. <Component {...key} />)', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      const key = hook().key
      expect(hook().key).toHaveProperty('key')
      expect(typeof hook().key.key).toBe('number')
    })

    it('returns new key after basic GET', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection())
      const key = hook().key
      await pause()
      expect(hook().key).not.toBe(key)
    })

    it('returns new key after operations (e.g. PATCH)', async () => {
      const { useCollection, updated, item } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()
      const key = hook().key
      act(() => {
        hook().update(updated, item)
      })
      await pause()
      expect(hook().key).not.toBe(key)
    })
  })
