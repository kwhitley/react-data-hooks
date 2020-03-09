import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const load = () =>
  describe('load(options = {})' + type('function'), () => {
    it('allows manual loading via the load() function', async () => {
      const { useCollection, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('data', [])
      act(() => {
        hook().load()
      })
      await pause()
      compare('data', api.get())
    })

    it('allows item endpoint loading on a collection hook (with id = undefined) via load(id)', async () => {
      const { useCollection, item, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(undefined))
      compare('data', undefined)
      act(() => {
        hook().load(item.id)
      })
      await pause()
      compare('data', item)
    })

    it('allows new item endpoint loading on a collection hook (with id = some id) via load(id)', async () => {
      const { useCollection, item, item2, api } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(item.id))
      compare('data', undefined)
      await pause()
      compare('data', item)
      act(() => {
        hook().load(item2.id)
      })
      await pause()
      compare('data', item2)
    })

    it(`accepts options as first argument (non item endpoints)`, async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      act(() => {
        hook().load({ query: { limit: 1 } })
      })
      await pause()
      compare('data', flaggedFeed)
    })

    describe('options enabled on load() as overrides of upstream options', () => {
      it(`fetchOptions: Object`, async () => {
        const fetchOptions = { headers: { Authorization: 'foo' } }
        const { useCollection, api, endpoint } = setup()
        let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
        fetchMock.getOnce(endpoint, flaggedFeed, { ...fetchOptions, overwriteRoutes: true })
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        act(() => {
          hook().load({ fetchOptions })
        })
        await pause()
        compare('data', flaggedFeed)
      })

      it(`query: Object | Function:Object`, async () => {
        const { useCollection, api, endpoint } = setup()
        let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
        fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
        act(() => {
          hook().load({ query: { limit: 1 } })
        })
        await pause()
        compare('data', flaggedFeed)
      })

      it(`returns a promise`, async () => {
        const { useCollection, api, endpoint } = setup()
        const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))

        act(() => {
          expect(() =>
            hook()
              .load()
              .then(() => {})
          ).not.toThrow()
        })

        await pause()
      })
    })
  })
