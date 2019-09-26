import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const refresh = () =>
  describe('refresh(options = {})' + type('function'), () => {
    it('is an alias of load() function', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      expect(hook().load).toStrictEqual(hook().refresh)
    })
  })
