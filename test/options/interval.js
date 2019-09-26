import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const interval = () =>
  describe('interval' + type('number (ms)') + defaults('undefined'), () => {
    it('allows polling of data via GET/load() at time = {interval}', async () => {
      const { useCollection, onLoad } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ onLoad, interval: 5 }))
      await pause()
      await pause()
      await pause()
      expect(onLoad).toHaveBeenCalledTimes(3)
    })
  })
