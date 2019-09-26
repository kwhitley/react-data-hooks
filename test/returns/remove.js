import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const remove = () =>
  describe('remove(item)' + type('function'), () => {
    it('sends DELETE, updates internal collection, and fires onRemove(item) when used with collection hook', async () => {
      const { useCollection, collection, item, onRemove } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ onRemove }))
      await pause()
      compare('data', collection)
      act(() => {
        hook().remove(item)
      })
      await pause()
      compare('data', collection.filter(i => i.id !== item.id))
      expect(onRemove).toHaveBeenCalled()
    })

    it('sends DELETE, clears self, and fires onRemove(item) when used with item hook', async () => {
      const { useCollection, collection, item, onRemove } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onRemove }))
      await pause()
      compare('data', item)
      act(() => {
        hook().remove(item)
      })
      await pause()
      compare('data', undefined)
      expect(onRemove).toHaveBeenCalled()
    })

    it('sends DELETE, clears self, and calls onRemove(item) from item hook { isCollection: false }', async () => {
      const { useItem, collection, item, onRemove } = setup()
      const { hook, compare, pause } = extractHook(() => useItem({ onRemove }))
      await pause()
      compare('data', item)
      act(() => {
        hook().remove(item)
      })
      await pause()
      compare('data', undefined)
      expect(onRemove).toHaveBeenCalled()
    })
  })
