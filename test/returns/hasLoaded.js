import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const hasLoaded = () =>
  describe('hasLoaded' + type('boolean') + defaults('false'), () => {
    let { useCollection } = setup()

    it('defaults to false', async () => {
      const { useCollection, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('hasLoaded', false)
    })

    it('is true after first GET request success', async () => {
      const { useCollection, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()
      compare('hasLoaded', true)
    })
  })
