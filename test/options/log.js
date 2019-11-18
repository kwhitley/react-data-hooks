import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const log = () =>
  describe('log' + type('boolean or function') + defaults('empty function'), () => {
    it('logging is turned off by default', async () => {
      const { useCollection } = setup()
      let originalLog = window.console.log
      let log = (window.console.log = jest.fn())
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      expect(log).not.toHaveBeenCalled()
      window.console.log = originalLog
    })

    it('uses console.log if { log: true }', async () => {
      const { useCollection } = setup()
      let originalLog = window.console.log
      let log = (window.console.log = jest.fn())
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, log: true }))
      expect(log).toHaveBeenCalled()
      window.console.log = originalLog
    })

    it('{ log: false } is allowed', async () => {
      const { useCollection } = setup()
      let originalLog = window.console.log
      let log = (window.console.log = jest.fn())
      const { hook, compare, pause } = extractHook(() => useCollection({ log: false }))
      await pause()
      expect(log).not.toHaveBeenCalled()
      window.console.log = originalLog
    })

    it('can accept any function to handle log (e.g. { log: console.info })', async () => {
      const { useCollection } = setup()
      const log = jest.fn()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false, log }))
      expect(log).toHaveBeenCalled()
    })
  })
