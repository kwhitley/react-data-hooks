import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const filter = () =>
  describe('filter' + type('function or object') + defaults('undefined'), () => {
    it('filtered returns the original data array if no filter set', async () => {
      const { useCollection, api, endpoint } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection())
      await pause()
      compare('filtered', api.get())
    })

    it(`filtered can use a filter function (e.g. { filter: item => !item.flag })`, async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ filter: i => i.flag }))
      await pause()
      compare('filtered', flaggedFeed.filter(i => i.flag))
    })

    it('filtered can use a filter object (e.g. { filter: { flag: false } })', async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ filter: { flag: true } }))
      await pause()
      compare('filtered', flaggedFeed.filter(i => i.flag))
    })
  })
