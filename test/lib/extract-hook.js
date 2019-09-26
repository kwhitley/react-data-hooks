import { renderHook } from '@testing-library/react-hooks'

export const extractHook = hookFn => {
  let renderedHook = renderHook(hookFn)

  return {
    hook: () => renderedHook.result.current,
    pause: renderedHook.waitForNextUpdate,
    compare: (...args) =>
      expect(renderedHook.result.current).toHaveProperty(...args),
  }
}
