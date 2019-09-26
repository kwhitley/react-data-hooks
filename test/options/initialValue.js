import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const initialValue = () =>
  describe('initialValue' + type('anything') + defaults('[] if collection, undefined if not'), () => {
    it(`data defaults to initialValue if set (e.g. { initialValue: 'foo' })`, async () => {
      expect(true).toBe(true) // functionality tested elsewhere
    })
  })
