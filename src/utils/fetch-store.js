import defaultAxios from 'axios'

export class FetchStore {
  fetches = {}
  fetcher = defaultAxios
  debounce = 100

  setAxios = axios => {
    this.fetcher = axios

    return this
  }

  setDebounce = value => {
    this.debounce = value
  }

  setExpiration = key => {
    let fetchEntry = this.fetches[key] || {}
    let { expires } = fetchEntry

    if (expires) {
      clearTimeout(expires)
    }

    fetchEntry.expires = setTimeout(() => this.expireFetch(key), this.debounce)
  }

  get = (...args) => {
    let key = JSON.stringify(args)
    let fetchEntry = this.fetches[key]

    if (fetchEntry) {
      this.setExpiration(key)
    }

    if (!fetchEntry) {
      fetchEntry = this.fetches[key] = {
        fetch: this.fetcher.get(...args),
      }

      this.setExpiration(key)
    }

    return fetchEntry.fetch
  }

  expireFetch = key => {
    delete this.fetches[key]
  }
}
