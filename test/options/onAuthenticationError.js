import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const onAuthenticationError = () =>
  describe('onAuthenticationError({ message, status? })' + type('function') + defaults('undefined'), () => {
    it('fires when receiving a 401 from GET or load()', async () => {
      const { useCollection, endpoint, onAuthenticationError } = setup()
      fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError }))
      await pause()
      expect(onAuthenticationError).toHaveBeenCalled()
    })

    it('fires when receiving a 403 from GET or load()', async () => {
      const { useCollection, endpoint, onAuthenticationError } = setup()
      fetchMock.getOnce(endpoint, 403, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError }))
      await pause()
      expect(onAuthenticationError).toHaveBeenCalled()
    })

    it('does not fire onError() on 401/403 if onAuthenticationError() defined', async () => {
      const { useCollection, endpoint, onAuthenticationError, onError } = setup()
      fetchMock.getOnce(endpoint, 403, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onAuthenticationError, onError }))
      await pause()
      expect(onAuthenticationError).toHaveBeenCalled()
      expect(onError).not.toHaveBeenCalled()
    })
  })
