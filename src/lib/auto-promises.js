// helper function to return an instantly resolved or rejected promise
export const resolveReject = resolution => (
  msg,
  options = {
    timeout: undefined,
    fn: undefined,
  }
) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      options.fn && options.fn()
      resolution === 'resolve' ? resolve(msg) : reject(msg)
    }, options.timeout)
  })

export const autoResolve = resolveReject('resolve')

export const autoReject = resolveReject('reject')
