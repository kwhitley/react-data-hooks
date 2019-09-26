import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const transform = () =>
  describe('transform' + type('function') + defaults('undefined'), () => {
    it('transform reshapes payload (e.g. { transform: r => r.data })', async () => {
      const { useCollection, endpoint, api } = setup()
      fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
      await pause()
      compare('data', api.get())
    })

    it('transform reshapes PATCH payload', async () => {
      const { useCollection, endpoint, itemEndpoint, update, collection, item, api, updated } = setup()
      fetchMock.patchOnce(itemEndpoint, { data: updated }, { overwriteRoutes: true })
      fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ transform: r => r.data }))
      await pause()
      act(() => {
        hook().update({ ...item, foo: 'bar' }, item)
      })
      await pause()
      compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
    })
  })
