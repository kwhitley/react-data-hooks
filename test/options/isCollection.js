import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const isCollection = () =>
  describe('isCollection' + type('boolean') + defaults('true if no ID, false otherwise'), () => {
    it('defaults to true for endpoints without ID (data = [])', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('data', [])
    })

    it('defaults to false for endpoints without ID (data = undefined)', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection('foo', { autoload: false }))
      compare('data', undefined)
    })

    it('allows fixed endpoints with { isCollection: false } (data = undefined)', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, isCollection: false }))
      compare('data', undefined)
    })
  })
