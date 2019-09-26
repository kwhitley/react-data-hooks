import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const query = () =>
  describe('query' + type('function or object') + defaults('undefined'), () => {
    it(`appends dynamic query to GET endpoint if function (e.g. { query: () => ({ limit: 1 }) })`, async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
      const { hook, compare, pause } = extractHook(() => useCollection({ query: () => ({ limit: 1 }) }))
      await pause()
      compare('data', flaggedFeed)
    })

    it(`appends static query to GET endpoint if object (e.g. { query: { limit: 1 } })`, async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint + '?limit=1', flaggedFeed)
      const { hook, compare, pause } = extractHook(() => useCollection({ query: { limit: 1 } }))
      await pause()
      compare('data', flaggedFeed)
    })
  })
