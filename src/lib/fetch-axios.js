const getBody = r => {
  const isJSON =
    (r.headers.get('content-type') || '').indexOf('application/json') !== -1

  if (isJSON) {
    return r.json()
  }

  return r.body || r
}

const emulateAxiosResponse = data => ({ data })

const catchErrors = response => {
  if (response.status >= 400) {
    const errorResponse = new Error(response.body || response.statusText)
    errorResponse.status = Number(response.status)

    throw errorResponse
  }

  return response
}

const createFetchCall = (method = 'GET') => (url, data) => {
  let payload = {}

  if (typeof data === 'object') {
    // parse query params
    if (method === 'GET') {
      let { params = {} } = data || {}
      let query = Object.keys(params)
        .map(
          param =>
            `${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`
        )
        .join('&')

      if (query.length) {
        url += '?' + query
      }
    } else {
      // parse payloads for POST|PUT|PATCH
      payload = {
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    }
  }

  return fetch(url, { method, ...payload })
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
