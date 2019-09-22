export * from './fetch-axios'
export * from './fetch-store'

export const getPatch = (newItem, oldItem) =>
  oldItem
    ? Object.keys(newItem).reduce((final, key) => {
        let newValue = newItem[key]
        let oldValue = oldItem[key]

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          final[key] = newValue
        }

        return final
      }, {})
    : newItem

export const objectFilter = (filter = {}) => (obj = {}) =>
  Object.keys(filter).reduce(
    (out, key) => out && filter[key] === obj[key],
    true
  )

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
