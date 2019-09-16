'use strict'

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.axios = void 0

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty')
)

var _typeof2 = _interopRequireDefault(require('@babel/runtime/helpers/typeof'))

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object)
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object)
    if (enumerableOnly)
      symbols = symbols.filter(function(sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable
      })
    keys.push.apply(keys, symbols)
  }
  return keys
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {}
    if (i % 2) {
      ownKeys(source, true).forEach(function(key) {
        ;(0, _defineProperty2.default)(target, key, source[key])
      })
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source))
    } else {
      ownKeys(source).forEach(function(key) {
        Object.defineProperty(
          target,
          key,
          Object.getOwnPropertyDescriptor(source, key)
        )
      })
    }
  }
  return target
}

var getJSON = function getJSON(r) {
  try {
    return r.json()
  } catch (err) {
    throw new TypeError('Invalid JSON response')
  } // let contentType = r.headers.get('content-type')
  // if (contentType && contentType.includes('application/json')) {
  //   return r.json()
  // }
  // throw new TypeError('Invalid JSON response')
}

var emulateAxiosResponse = function emulateAxiosResponse(data) {
  return {
    data: data,
  }
}

var catchErrors = function catchErrors(response) {
  if (response.status >= 400) {
    throw new Error(Number(response.status))
  }

  return response
}

var createFetchCall = function createFetchCall() {
  var method =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'GET'
  return function(url, data) {
    var payload = undefined

    if ((0, _typeof2.default)(data) === 'object') {
      // parse query params
      if (method === 'GET') {
        var _ref = data || {},
          _ref$params = _ref.params,
          params = _ref$params === void 0 ? {} : _ref$params

        var query = Object.keys(params)
          .map(function(param) {
            return ''
              .concat(encodeURIComponent(param), '=')
              .concat(encodeURIComponent(params[param]))
          })
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

    var content = _objectSpread(
      {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      payload
    )

    return fetch(url, content)
      .then(catchErrors)
      .then(getJSON)
      .then(emulateAxiosResponse)
  }
}

var axios = {
  get: createFetchCall('GET'),
  post: createFetchCall('POST'),
  put: createFetchCall('PUT'),
  patch: createFetchCall('PATCH'),
  delete: createFetchCall('DELETE'),
}
exports.axios = axios
