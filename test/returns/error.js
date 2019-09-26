import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const error = () =>
  describe('error' + type('undefined or error object { message, status?, ...other }') + defaults('undefined'), () => {
    it('is undefined by default', async () => {
      const { useCollection } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ autoload: false }))
      compare('error', undefined)
    })

    it(`contains a message (e.g. { message: 'Foo' }) when thrown via try/catch`, async () => {
      const { useCollection, suppressError } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transform: d => d.will.fail,
          ...suppressError,
        })
      )
      await pause()
      expect(hook().error.message).not.toBe(undefined)
    })

    it(`contains a message and status (e.g. { message: 'Not Found', status: 400 }) when thrown via response error`, async () => {
      const { endpoint, useCollection, suppressError } = setup()
      fetchMock.getOnce(endpoint, 404, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transform: d => d.will.fail,
          ...suppressError,
        })
      )
      await pause()
      expect(hook().error.message).toBe('Not Found')
      expect(hook().error.status).toBe(404)
    })

    it('is caught by transform() errors', async () => {
      const { useCollection, suppressError } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transform: d => d.will.fail,
          ...suppressError,
        })
      )
      await pause()
      expect(hook().error).not.toBe(undefined)
    })

    it('is caught by transformCollection() errors', async () => {
      const { useCollection, suppressError } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transformCollection: d => d.will.fail,
          ...suppressError,
        })
      )
      await pause()
      expect(hook().error).not.toBe(undefined)
    })

    it('is caught by transformItem() errors', async () => {
      const { useItem, suppressError } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useItem({
          transformItem: d => d.will.fail,
          ...suppressError,
        })
      )
      await pause()
      expect(hook().error).not.toBe(undefined)
    })
  })
