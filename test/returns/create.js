import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const create = () =>
  describe('create(item)' + type('function'), () => {
    it('sends POST, updates internal collection, and fires onCreate(item) when used with collection hook', async () => {
      let { useCollection, api, endpoint, collection, item, onCreate, newItem, postResponse } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ onCreate }))
      await pause()
      compare('data', collection)
      act(() => {
        hook().create(newItem)
      })
      await pause()
      compare('data', [...collection, postResponse])
      expect(onCreate).toHaveBeenCalled()
    })
  })
