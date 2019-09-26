import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const isLoading = () =>
  describe('isLoading' + type('boolean') + defaults('false until loading'), () => {
    it('is false before loading data', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('isLoading', false)
    })
  })
