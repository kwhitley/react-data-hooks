import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const hasLoaded = () =>
  describe('hasLoaded' + type('boolean') + defaults('false'), () => {
    it('defaults to false, then sets to true once loaded even once', async () => {
      const { useCollection, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('hasLoaded', false)
    })

    it('defaults to false, then sets to true once loaded even once', async () => {
      const { useCollection, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection())
      compare('hasLoaded', false)
      act(() => {
        hook().load()
      })
      await pause()
      compare('hasLoaded', true)
    })
  })
