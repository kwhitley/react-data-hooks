import 'whatwg-fetch'
import fetchMock from 'fetch-mock'
import { act } from '@testing-library/react-hooks'
import { extractHook, example, type, defaults, setup } from '../lib'

export const onError = () =>
  describe('onError({ message, status? })' + type('function') + defaults('console.log'), () => {
    it('throws error if passed an ID when option { isCollection: false }', async () => {
      const { useCollection } = setup()
      expect(() => useCollection(12, { isCollection: false })).toThrow()
    })

    it('returned error obj toString() === err.message', async () => {
      const { useCollection, endpoint } = setup()
      fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
      const onError = jest.fn(err => err.toString())
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      await pause()
      expect(onError).toHaveReturnedWith('Error: Unauthorized')
    })

    it('containst status code for response errors', async () => {
      const { useCollection, endpoint } = setup()
      fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
      const onError = jest.fn(err => err.status)
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      await pause()
      expect(onError).toHaveReturnedWith(401)
    })

    it('containst no status code for try/catch errors', async () => {
      const { useCollection, endpoint, onError } = setup()
      const { hook, compare, pause } = extractHook(() => useCollection({ transform: d => d.will.break, onError }))
      await pause()
      expect(onError).toHaveBeenCalled()
      expect(onError).toHaveReturnedWith(undefined)
    })

    it('sets error prop and calls onError() with transform error', async () => {
      const { useCollection, onError } = setup()
      const { hook, compare, pause } = extractHook(() =>
        useCollection({
          transform: d => d.will.break,
          onError,
        })
      )
      expect(hook().error).toBeUndefined()
      await pause()
      expect(hook().error).not.toBeUndefined()
      expect(onError).toHaveBeenCalled()
    })

    it('sets error prop and calls onError() with response status error', async () => {
      const { useCollection, endpoint, onError } = setup()
      fetchMock.getOnce(endpoint, 404, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      expect(hook().error).toBeUndefined()
      await pause()
      expect(hook().error).not.toBeUndefined()
      expect(hook().error.message).toBe('Not Found')
      expect(onError).toHaveBeenCalled()
    })

    it('onError gets full response body on error code response (e.g. POST 409)', async () => {
      const { useCollection, endpoint, newItem } = setup()
      const onError = jest.fn(err => err.message)
      fetchMock.postOnce(
        endpoint,
        {
          status: 409,
          body: { type: 'Conflict Error', message: 'User already exists' },
        },
        { overwriteRoutes: true }
      )
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      expect(hook().error).toBeUndefined()
      act(() => {
        hook().create(newItem)
      })
      await pause()
      expect(onError).toHaveReturnedWith('User already exists')
      expect(hook().error.message).toBe('User already exists')
      expect(hook().error.type).toBe('Conflict Error')
      expect(onError).toHaveBeenCalled()
    })

    it('sets calls onError() with 401/403 errors if onAuthenticationError() not defined', async () => {
      const { useCollection, endpoint, onError } = setup()
      fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      await pause()
      expect(onError).toHaveBeenCalled()
    })

    it('intercepts and prevents other success events (e.g. onUpdate, onCreate, onReplace, etc)', async () => {
      const { useCollection, endpoint, item, itemEndpoint, onError, onLoad, onUpdate, updated } = setup()
      fetchMock.getOnce(endpoint, 401, { overwriteRoutes: true })
      fetchMock.patchOnce(itemEndpoint, 401, { overwriteRoutes: true })
      const { hook, compare, pause } = extractHook(() => useCollection({ onUpdate, onError, onLoad }))
      await pause()
      expect(onError).toHaveBeenCalled()
      expect(onLoad).not.toHaveBeenCalled()

      act(() => {
        hook().update(updated, item)
      })
      await pause()
      expect(onError).toHaveBeenCalledTimes(2)
      expect(onUpdate).not.toHaveBeenCalled()
    })

    it('returned payload from errored response is delivered to onError', async () => {
      const { useCollection, endpoint } = setup()
      fetchMock.getOnce(
        endpoint,
        {
          status: 409,
          body: { detail: 'try again' },
        },
        { overwriteRoutes: true }
      )
      const onError = jest.fn(err => Object.assign({}, err))
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      await pause()
      expect(onError).toHaveReturnedWith({ status: 409, msg: 'Conflict', detail: 'try again' })
    })

    it('honors error.message default', async () => {
      const { useCollection, endpoint } = setup()
      fetchMock.getOnce(
        endpoint,
        {
          status: 409,
          body: { detail: 'try again' },
        },
        { overwriteRoutes: true }
      )
      const onError = jest.fn(err => err.message)
      const { hook, compare, pause } = extractHook(() => useCollection({ onError }))
      await pause()
      expect(onError).toHaveReturnedWith('Conflict')
    })
  })
