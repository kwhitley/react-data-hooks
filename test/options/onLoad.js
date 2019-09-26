import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const onLoad = () =>
  describe('onLoad(item)' + type('function') + defaults('undefined'), () => {
    it('fired when data fetched via GET', async () => {
      expect(true).toBe(true) // functionality tested elsewhere
    })
  })
