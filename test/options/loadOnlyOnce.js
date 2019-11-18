import { act, rerender } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const loadOnlyOnce = () =>
  describe('loadOnlyOnce' + type('boolean') + defaults('false'), () => {
    let { useCollection } = setup()

    it('when true, prevents subsequent GET requests shared when component remounts (TODO)', async () => {
      const { useCollection, onLoad } = setup()
      const { rerender, hook, compare, pause } = extractHook(() => useCollection({ onLoad }))
      await pause()
      expect(onLoad).toHaveBeenCalled()
      act(() => {
        rerender()
      })
      await pause()
      expect(onLoad).toHaveBeenCalledTimes(1)
    })
  })
