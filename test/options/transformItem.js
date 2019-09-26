import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const transformItem = () =>
  describe('transformItem' + type('function') + defaults('undefined'), () => {
    const transformItem = item => ({ ...item, transformed: true })
    const transformCollection = c => c.slice(0, 1)

    it('transformItem reshapes each item within collection on GET (e.g. { transformItem: item => ({ ...item, isCool: true }) })', async () => {
      const { useCollection, collection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ transformItem }))
      await pause()
      compare('data', collection.map(transformItem))
    })

    it('transformItem reshapes data on GET with item endpoint', async () => {
      const { useItem, collection, item } = setup()
      const { hook, compare, pause } = extractHook(() => useItem({ transformItem }))
      await pause()
      compare('data', transformItem(item))
    })

    it('fires after transform() and transformCollection() if defined (on collection endpoints)', async () => {
      const { useCollection, collection, api, endpoint } = setup()
      fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transform: r => r.data,
          transformCollection,
          transformItem,
        })
      )
      await pause()
      compare('data', transformCollection(collection).map(transformItem))
    })

    it('transforms data on operations (e.g. PATCH)', async () => {
      const { useCollection, collection, item, updated, onUpdate } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate }))
      await pause()
      compare('data', collection)
      act(() => {
        hook().update(updated, item)
      })
      await pause()
      compare('data', collection.map(i => (i.id !== item.id ? i : updated)))
      expect(onUpdate).toHaveBeenCalled()
    })
  })
