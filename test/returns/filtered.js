import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const filtered = () =>
  describe('filtered' + type('empty array (if collection) or undefined (if item)'), () => {
    let { useCollection } = setup()

    it('data defaults to [] if no ID passed and { isCollection: false } not set', async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('filtered', [])
    })

    it('filtered defaults to undefined if item hook { isCollection: false }', async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ isCollection: false, autoload: false }))
      compare('filtered', undefined)
    })

    it(`filtered defaults to undefined if string identifier passed to collection hook (e.g. useHook('foo'))`, async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection('foo', { autoload: false }))
      compare('filtered', undefined)
    })

    it(`filtered defaults to undefined if numeric identifier passed to collection hook (e.g. useHook(123))`, async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(123, { autoload: false }))
      compare('filtered', undefined)
    })

    it(`filtered defaults to initialValue if set (e.g. { initialValue: 'foo' })`, async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, initialValue: 'foo' }))
      compare('filtered', 'foo')
    })

    it(`filtered can use a filter function (e.g. { filter: item => !item.flag })`, async () => {
      const { useCollection, api, endpoint } = setup()
      let flaggedFeed = api.get().map(i => ({ ...i, flag: Math.random() > 5 }))
      fetchMock.getOnce(endpoint, flaggedFeed, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ filter: i => i.flag }))
      await pause()
      compare('filtered', flaggedFeed.filter(i => i.flag))
    })

    it(`filtered has no effect if used on an item hook`, async () => {
      const { useItem, item } = setup()
      const { hook, compare, pause } = extractHook(() => useItem({ filter: i => i.flag }))
      await pause()
      compare('data', item)
      compare('filtered', item)
    })
  })
