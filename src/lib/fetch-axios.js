const getBody = r => {
  const isJSON = (r.headers.get('content-type') || '').indexOf('application/json') !== -1

  if (isJSON) {
    return r.json()
  }

  return r.body
}

const emulateAxiosResponse = data => ({ data })

const catchErrors = response => {
  if (response.status >= 400) {
    const isJSON = (response.headers.get('content-type') || '').indexOf('application/json') !== -1
    const errorResponse = new Error(response.statusText)
    errorResponse.status = Number(response.status)
    errorResponse.msg = response.statusText
    if (isJSON) {
      errorResponse.body = JSON.parse(response.body)
    }

    throw errorResponse
  }

  return response
}

const createFetchCall = (method = 'GET') => (url, data, fetchOptions = {}) => {
  let payload = {}

  // if (Object.keys(fetchOptions).length) {
  //   console.log('creating', method, 'call with fetchOptions', fetchOptions)
  // }

  let { headers = {}, ...otherFetchOptions } = fetchOptions
  fetchOptions = otherFetchOptions
  fetchOptions.headers = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (typeof data === 'object') {
    // parse query params
    if (method === 'GET') {
      let { params = {} } = data || {}
      let query = Object.keys(params)
        .map(param => `${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`)
        .join('&')

      if (query.length) {
        url += '?' + query
      }
    } else {
      // parse payloads for POST|PUT|PATCH
      payload = {
        body: JSON.stringify(data),
      }
    }
  }

  return fetch(url, { method, ...payload, ...fetchOptions })
    .then(catchErrors)
    .then(getBody)
    .then(emulateAxiosResponse)
}

export const fetchAxios = {
  get: createFetchCall('GET'),
  post: createFetchCall('POST'),
  put: createFetchCall('PUT'),
  patch: createFetchCall('PATCH'),
  delete: createFetchCall('DELETE'),
}
