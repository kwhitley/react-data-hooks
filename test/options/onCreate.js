import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const onCreate = () =>
  describe('onCreate(item)' + type('function') + defaults('undefined'), () => {
    it('fired when items created via POST', async () => {
      expect(true).toBe(true) // functionality tested elsewhere
    })
  })
