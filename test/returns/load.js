import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const load = () =>
  describe('load(options = {})' + type('function'), () => {
    it('allows manual loading via the load() function', async () => {
      const { useCollection, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('data', [])
      act(() => {
        hook().load()
      })
      await pause()
      compare('data', api.get())
    })
  })
