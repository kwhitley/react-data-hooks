import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const transformCollection = () =>
  describe('transformCollection' + type('function') + defaults('undefined'), () => {
    it('transformCollection reshapes collection on GET (e.g. { transformCollection: c => c.slice(0,1) })', async () => {
      const { useCollection, collection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ transformCollection: c => c.slice(0, 1) }))
      await pause()
      compare('data', collection.slice(0, 1))
    })

    it('fires after transform() if defined', async () => {
      const { useCollection, collection, endpoint, api } = setup()
      fetchMock.getOnce(endpoint, { data: api.get() }, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transform: r => r.data,
          transformCollection: c => c.slice(0, 1),
        })
      )
      await pause()
      compare('data', collection.slice(0, 1))
    })

    it('does not fire on { collection: false } endpoints', async () => {
      const { useItem, collection, item } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useItem({
          transformCollection: i => ({ ...i, bad: 'omen' }),
          transformItem: i => ({ ...i, foo: 'bar' }),
        })
      )
      await pause()
      compare('data', { ...item, foo: 'bar' })
    })

    it('does not fire on collection item endpoints (e.g. useHook(id))', async () => {
      const { useCollection, collection, item } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useCollection(item.id, {
          transformCollection: i => ({ ...i, bad: 'omen' }),
          transformItem: i => ({ ...i, foo: 'bar' }),
        })
      )
      await pause()
      compare('data', { ...item, foo: 'bar' })
    })
  })
