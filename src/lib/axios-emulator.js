const getJSON = r => {
  try {
    return r.json()
  } catch (err) {
    throw new TypeError('Invalid JSON response')
  }
  // let contentType = r.headers.get('content-type')

  // if (contentType && contentType.includes('application/json')) {
  //   return r.json()
  // }

  // throw new TypeError('Invalid JSON response')
}

const emulateAxiosResponse = data => ({ data })

const catchErrors = response => {
  if (response.status >= 400) {
    throw new Error(Number(response.status))
  }

  return response
}

const createFetchCall = (method = 'GET') => (url, data) => {
  let payload = undefined

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
      payload = { body: JSON.stringify(data) }
    }
  }

  const content = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
    },
    ...payload,
  }

  return fetch(url, content)
    .then(catchErrors)
    .then(getJSON)
    .then(emulateAxiosResponse)
}

export const axios = {
  get: createFetchCall('GET'),
  post: createFetchCall('POST'),
  put: createFetchCall('PUT'),
  patch: createFetchCall('PATCH'),
  delete: createFetchCall('DELETE'),
}
