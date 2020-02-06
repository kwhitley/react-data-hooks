import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const namespace = () =>
  describe(
    'namespace' + type('string, number, or function that returns a string or number') + defaults('undefined'),
    () => {
      it('must either be string, number, or function that returns a string or number (TODO)', async () => {
        const { useCollection, api, endpoint } = setup()

        // expect(() => extractHook(useCollection({ namespace: 'foo' }))).not.toThrow()
        expect(true).toBe(true)
      })
    }
  )
