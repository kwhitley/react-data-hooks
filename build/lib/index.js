'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
var _exportNames = {
  getPatch: true,
  objectFilter: true,
  resolveReject: true,
  autoResolve: true,
  autoReject: true,
}
exports.autoReject = exports.autoResolve = exports.resolveReject = exports.objectFilter = exports.getPatch = void 0

var _fetchAxios = require('./fetch-axios')

Object.keys(_fetchAxios).forEach(function(key) {
  if (key === 'default' || key === '__esModule') return
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _fetchAxios[key]
    },
  })
})

var _fetchStore = require('./fetch-store')

Object.keys(_fetchStore).forEach(function(key) {
  if (key === 'default' || key === '__esModule') return
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _fetchStore[key]
    },
  })
})

var getPatch = function getPatch(newItem, oldItem) {
  return oldItem
    ? Object.keys(newItem).reduce(function(final, key) {
        var newValue = newItem[key]
        var oldValue = oldItem[key]

        if (JSON.stringify(newValue) !== JSON.stringify(oldValue)) {
          final[key] = newValue
        }

        return final
      }, {})
    : newItem
}

exports.getPatch = getPatch

var objectFilter = function objectFilter() {
  var filter =
    arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
  return function() {
    var obj =
      arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
    return Object.keys(filter).reduce(function(out, key) {
      return out && filter[key] === obj[key]
    }, true)
  }
} // helper function to return an instantly resolved or rejected promise

exports.objectFilter = objectFilter

var resolveReject = function resolveReject(resolution) {
  return function(msg) {
    var options =
      arguments.length > 1 && arguments[1] !== undefined
        ? arguments[1]
        : {
            timeout: undefined,
            fn: undefined,
          }
    return new Promise(function(resolve, reject) {
      setTimeout(function() {
        options.fn && options.fn()
        resolution === 'resolve' ? resolve(msg) : reject(msg)
      }, options.timeout)
    })
  }
}

exports.resolveReject = resolveReject
var autoResolve = resolveReject('resolve')
exports.autoResolve = autoResolve
var autoReject = resolveReject('reject')
exports.autoReject = autoReject
