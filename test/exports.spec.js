import { renderHook, cleanup, act, unmount } from '@testing-library/react-hooks'
import { createRestHook } from '../build'

describe('react-use-rest', () => {
  describe('EXPORTS', () => {
    test(`import { createRestHook } from 'react-use-rest'`, () => {
      expect(typeof createRestHook).toBe('function')
    })
  })

  describe('createRestHook(endpoint, options) return interface', () => {
    const useData = createRestHook('/api/somewhere')

    const { result } = renderHook(() => useData({ autoload: false }))

    const attributes = [
      { name: 'data', type: 'object' },
      { name: 'filtered', type: 'object' },
      { name: 'key', type: 'object' },
      { name: 'isLoading', type: 'boolean' },
      { name: 'error', type: 'undefined' },
      { name: 'load', type: 'function' },
      { name: 'refresh', type: 'function' },
      { name: 'create', type: 'function' },
      { name: 'remove', type: 'function' },
      { name: 'replace', type: 'function' },
      { name: 'update', type: 'function' },
    ]

    let hook = result.current

    for (let attribute of attributes) {
      test(`returns ${attribute.name} property (${attribute.type})`, () => {
        expect(hook.hasOwnProperty(attribute.name)).toBe(true)
        expect(typeof hook[attribute.name]).toBe(attribute.type)
      })
    }
  })
})
