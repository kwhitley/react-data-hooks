import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const update = () =>
  describe('update(item|changes, oldItem)' + type('function'), () => {
    it('sends PATCH, updates internal collection, and fires onUpdate(item) when used with collection hook', async () => {
      const { useCollection, collection, updated, item, onUpdate } = setup()
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

    it('sends PATCH and updates self when used with item hook', async () => {
      const { useCollection, collection, updated, item, onUpdate } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onUpdate }))
      await pause()
      compare('data', item)
      act(() => {
        hook().update(updated, item)
      })
      await pause()
      compare('data', updated)
      expect(onUpdate).toHaveBeenCalled()
    })

    it('sends PATCH, updates self, fires chained promises, and calls onUpdate(item) from item hook { isCollection: false }', async () => {
      const { useItem, collection, updated, item, onUpdate, fn } = setup()
      const { hook, compare, pause } = extractHook(() => useItem({ onUpdate }))
      await pause()
      compare('data', item)
      act(() => {
        hook()
          .update(updated, item)
          .then(fn)
      })
      await pause()
      expect(onUpdate).toHaveBeenCalled()
      expect(fn).toHaveBeenCalled()
    })

    it('collection hook does not update self, or fire onUpdate with response error', async () => {
      const { useCollection, itemEndpoint, collection, item, updated, onUpdate, onError } = setup()
      fetchMock.patchOnce(itemEndpoint, 401, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate, onError }))
      await pause()
      compare('data', collection)
      act(() => {
        hook().update(updated, item)
      })
      await pause()
      compare('data', collection)
      expect(onUpdate).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalled()
    })

    it('item hook does not update self, or fire onUpdate with response error', async () => {
      const { useItem, itemEndpoint, collection, item, updated, onUpdate, onError } = setup()
      fetchMock.patchOnce(itemEndpoint, 401, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useItem({ onUpdate, onError }))
      await pause()
      compare('data', item)
      act(() => {
        hook().update(updated, item)
      })
      await pause()
      compare('data', item)
      expect(onUpdate).not.toHaveBeenCalled()
      expect(onError).toHaveBeenCalled()
    })
  })
