import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const replace = () =>
  describe('replace(item, oldItem)' + type('function'), () => {
    it('sends PUT, updates internal collection, and fires onReplace(item) when used with collection hook', async () => {
      const { useCollection, collection, item, updated, onReplace } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ onReplace }))
      await pause()
      compare('data', collection)
      act(() => {
        hook().replace({ ...item, foo: 'bar' }, item)
      })
      await pause()
      compare('data', collection.map(i => (i.id !== item.id ? i : { ...i, ...updated })))
      expect(onReplace).toHaveBeenCalled()
    })

    it('sends PUT, updates internal collection, and fires onReplace(item) when used with item hook', async () => {
      const { useCollection, collection, item, updated, onReplace } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(item.id, { onReplace }))
      await pause()
      compare('data', item)
      act(() => {
        hook().replace(updated, item)
      })
      await pause()
      compare('data', updated)
      expect(onReplace).toHaveBeenCalled()
    })

    it('sends PUT, replaces self, and calls onReplace(item) from item hook { isCollection: false }', async () => {
      const { useItem, collection, item, updated, onReplace } = setup()
      const { hook, compare, pause } = extractHook(() => useItem({ onReplace }))
      await pause()
      compare('data', item)
      act(() => {
        hook().replace(updated, item)
      })
      await pause()
      compare('data', updated)
      expect(onReplace).toHaveBeenCalled()
    })
  })
