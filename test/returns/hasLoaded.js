import { extractHook, example, type, defaults, setup } from '../lib'

export const data = () =>
  describe('hasLoaded' + type('empty array (if collection) or undefined (if item)'), () => {
    let { useCollection } = setup()
    it('default of { autoload: true } loads data from endpoint immediately', async () => {
      expect(true).toBe(true) // functionality tested with option:autoload
    })

    it('does not autoload if { autoload: false }', async () => {
      expect(true).toBe(true) // functionality tested with option:autoload
    })

    it('data defaults to [] if no ID passed and { isCollection: false } not set', async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('data', [])
    })

    it('data defaults to undefined if item hook { isCollection: false }', async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ isCollection: false, autoload: false }))
      compare('data', undefined)
    })

    it(`data defaults to undefined if string identifier passed to collection hook (e.g. useHook('foo'))`, async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection('foo', { autoload: false }))
      compare('data', undefined)
    })

    it(`data defaults to undefined if numeric identifier passed to collection hook (e.g. useHook(123))`, async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection(123, { autoload: false }))
      compare('data', undefined)
    })

    it(`data defaults to initialValue if set (e.g. { initialValue: 'foo' })`, async () => {
      let { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, initialValue: 'foo' }))
      compare('data', 'foo')
    })
  })
