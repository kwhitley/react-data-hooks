import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const fetchOptions = () =>
  describe('fetchOptions' + type('object') + defaults('undefined'), () => {
    const fetchOptions = { headers: { Authorization: 'foo' } }

    it(`will embed options into GET fetch requests (e.g. { fetchOptions: { headers: { Authorization: 'foo' } } })`, async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint, flaggedFeed, { ...fetchOptions, overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ fetchOptions }))
      await pause()
      compare('data', flaggedFeed)
    })

    it(`will embed options into PATCH/etc fetch requests (e.g. { fetchOptions: { headers: { Authorization: 'foo' } } })`, async () => {
      const { useCollection, collection, item, itemEndpoint, updated, newItem, onUpdate } = setup()
      fetchMock.patchOnce(itemEndpoint, updated, { ...fetchOptions, overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ fetchOptions, onUpdate }))
      await pause()
      compare('data', collection)
      act(() => {
        hook().update(updated, item)
      })
      await pause()
      compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
      expect(onUpdate).toHaveBeenCalledWith(updated)
    })
  })
