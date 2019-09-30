'use strict'

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.createRestHook = void 0

var _toConsumableArray2 = _interopRequireDefault(require('@babel/runtime/helpers/toConsumableArray'))

var _defineProperty2 = _interopRequireDefault(require('@babel/runtime/helpers/defineProperty'))

var _slicedToArray2 = _interopRequireDefault(require('@babel/runtime/helpers/slicedToArray'))

var _typeof2 = _interopRequireDefault(require('@babel/runtime/helpers/typeof'))

var _react = require('react')

var _useStoreHook = require('use-store-hook')

var _deepmerge = _interopRequireDefault(require('deepmerge'))

var _lib = require('./lib')

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
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
      })
    }
  }
  return target
}

var LOG_PREFIX = '[react-use-rest]:' // helper function to assemble endpoint parts, joined by '/', but removes undefined attributes

var getEndpoint = function getEndpoint() {
  for (var _len = arguments.length, parts = new Array(_len), _key = 0; _key < _len; _key++) {
    parts[_key] = arguments[_key]
  }

  return parts
    .filter(function(p) {
      return p !== undefined
    })
    .join('/')
}

var getHash = function getHash() {
  return {
    key: Math.floor(Math.random() * 1e12),
  }
} // helper function to handle functions that may be passed a DOM event

var eventable = function eventable(fn) {
  return function() {
    var arg0 = (arguments.length <= 0 ? undefined : arguments[0]) || {}

    if (arg0.nativeEvent instanceof Event) {
      return fn()
    }

    return fn.apply(void 0, arguments)
  }
}

var fetchStore = new _lib.FetchStore()

var createLogAndSetMeta = function createLogAndSetMeta(_ref) {
  var log = _ref.log,
    setMeta = _ref.setMeta
  return function(newMeta) {
    log('setting meta', newMeta)
    setMeta(newMeta)
  }
}

var createRestHook = function createRestHook(endpoint) {
  var createHookOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {}
  return function() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2]
    }

    var id = args[0],
      hookOptions = args[1]
    var isMountedRef = (0, _react.useRef)(true)
    var isMounted = isMountedRef.current
    var idExplicitlyPassed = args.length && (0, _typeof2.default)(args[0]) !== 'object'

    if ((0, _typeof2.default)(id) === 'object' && hookOptions === undefined) {
      // e.g. useHook({ something })
      hookOptions = id // use first param as options

      id = undefined
    } // local options are a blend of factory options and instantiation options

    var options = (0, _deepmerge.default)(createHookOptions, hookOptions || {}) // extract options

    var _options$autoload = options.autoload,
      autoload = _options$autoload === void 0 ? true : _options$autoload,
      _options$axios = options.axios,
      axios = _options$axios === void 0 ? _lib.fetchAxios : _options$axios,
      filter = options.filter,
      _options$getId = options.getId,
      getId =
        _options$getId === void 0
          ? function(item) {
              return item.id
            }
          : _options$getId,
      initialValue = options.initialValue,
      interval = options.interval,
      isCollection = options.isCollection,
      _options$loadOnlyOnce = options.loadOnlyOnce,
      loadOnlyOnce = _options$loadOnlyOnce === void 0 ? false : _options$loadOnlyOnce,
      _options$log = options.log,
      log = _options$log === void 0 ? function() {} : _options$log,
      onAuthenticationError = options.onAuthenticationError,
      _options$onCreate = options.onCreate,
      onCreate = _options$onCreate === void 0 ? function() {} : _options$onCreate,
      _options$onError = options.onError,
      onError = _options$onError === void 0 ? console.error : _options$onError,
      _options$onLoad = options.onLoad,
      onLoad = _options$onLoad === void 0 ? function() {} : _options$onLoad,
      _options$onRemove = options.onRemove,
      onRemove = _options$onRemove === void 0 ? function() {} : _options$onRemove,
      _options$onReplace = options.onReplace,
      onReplace = _options$onReplace === void 0 ? function() {} : _options$onReplace,
      _options$onUpdate = options.onUpdate,
      onUpdate = _options$onUpdate === void 0 ? function() {} : _options$onUpdate,
      _options$mergeOnCreat = options.mergeOnCreate,
      mergeOnCreate = _options$mergeOnCreat === void 0 ? true : _options$mergeOnCreat,
      _options$mergeOnUpdat = options.mergeOnUpdate,
      mergeOnUpdate = _options$mergeOnUpdat === void 0 ? true : _options$mergeOnUpdat,
      mock = options.mock,
      _options$query = options.query,
      query = _options$query === void 0 ? {} : _options$query,
      transform = options.transform,
      transformCollection = options.transformCollection,
      transformItem = options.transformItem
    var isCollectionExplicitlySet = options.hasOwnProperty('isCollection')
    var isFixedEndpoint = isCollection === false // allow { log: true } alias as well as routing to custom loggers

    log = log === true ? console.log : log

    if (axios !== _lib.fetchAxios) {
      log('using custom axios-fetch', axios)
      fetchStore.setAxios(axios)
    } // if isCollection not explicitly set, try to derive from arguments

    if (!isCollectionExplicitlySet) {
      // for collections, clear id, and derive options from first param
      if (idExplicitlyPassed) {
        // e.g. useHook('foo') useHook(3)
        isCollection = false
        isFixedEndpoint = true
      } else {
        isCollection = true
      }
    } else {
      // isCollection explicitly set
      if (isCollection === false && idExplicitlyPassed) {
        var errorObj = new Error(
          ''.concat(LOG_PREFIX, ' id should not be explicitly passed with option { isCollection: false }')
        )
        errorObj.isCollection = isCollection
        errorObj.idExplicitlyPassed = idExplicitlyPassed
        errorObj.args = args
        onError(errorObj)
        throw errorObj
      }
    } // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)

    initialValue = options.hasOwnProperty('initialValue') ? initialValue : isCollection ? [] : undefined
    var queryKey =
      (0, _typeof2.default)(query) === 'object'
        ? Object.keys(query).length
          ? JSON.stringify(query)
          : undefined
        : typeof query === 'function'
        ? JSON.stringify({
            dynamic: true,
          })
        : undefined
    var key = 'resthook:' + getEndpoint(endpoint, (!isCollection && (id || ':id')) || undefined, queryKey)

    var _useStore = (0, _useStoreHook.useStore)(key, initialValue, options),
      _useStore2 = (0, _slicedToArray2.default)(_useStore, 2),
      data = _useStore2[0],
      setData = _useStore2[1]

    var _useStore3 = (0, _useStoreHook.useStore)(key + ':loaded.once', false),
      _useStore4 = (0, _slicedToArray2.default)(_useStore3, 2),
      loadedOnce = _useStore4[0],
      setLoadedOnce = _useStore4[1]

    var _useState = (0, _react.useState)({
        isLoading: autoload,
        filtered: initialValue,
        error: undefined,
        key: getHash(),
      }),
      _useState2 = (0, _slicedToArray2.default)(_useState, 2),
      meta = _useState2[0],
      setMeta = _useState2[1]

    var prevFetchConfig = undefined
    var logAndSetMeta = createLogAndSetMeta({
      log: log,
      setMeta: setMeta,
    })

    var handleError = function handleError() {
      var error = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}

      if ((0, _typeof2.default)(error) === 'object') {
        var msg = error.msg,
          status = error.status
        var body

        if (error.response) {
          status = error.response.status
          msg = error.response.data
          body = error.response
        } else if (!status && Number(msg)) {
          status = Number(msg)
          msg = undefined
          body = error
        }
      }

      var errorObj = new Error(msg)
      errorObj.status = status
      errorObj.msg = msg
      Object.keys(error || {}).forEach(function(key) {
        return (errorObj[key] = error[key])
      })
      log(''.concat(LOG_PREFIX, ' handleError executed'), errorObj)
      isMounted &&
        logAndSetMeta(
          _objectSpread({}, meta, {
            isLoading: false,
            error: errorObj,
          })
        ) // handle authentication errors

      if (typeof onAuthenticationError === 'function' && [401, 403].includes(status)) {
        onAuthenticationError(errorObj)
      } else {
        onError(errorObj)
      }
    }

    var createActionType = function createActionType() {
      var actionOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
      return function(item, oldItem) {
        var itemId = id || (isFixedEndpoint ? undefined : getId(item))
        var _actionOptions$action = actionOptions.actionType,
          actionType = _actionOptions$action === void 0 ? 'update' : _actionOptions$action,
          _actionOptions$method = actionOptions.method,
          method = _actionOptions$method === void 0 ? 'patch' : _actionOptions$method
        var payload = undefined
        log(actionType.toUpperCase(), 'on', item, 'with id', itemId)

        if (!isFixedEndpoint && !itemId && actionType !== 'create') {
          return (0, _lib.autoReject)('Could not '.concat(actionType, ' item (see log)'), {
            fn: function fn() {
              onError({
                message: ''.concat(LOG_PREFIX, ' option.getId(item) did not return a valid ID'),
                item: item,
              })
            },
          })
        }

        if (['update', 'replace'].includes(actionType)) {
          var changes = (0, _lib.getPatch)(item, oldItem)
          var isPatch = actionType === 'update'

          if (!Object.keys(changes).length) {
            return (0, _lib.autoReject)('No changes to save')
          }

          payload = isPatch ? changes : item
        }

        if (actionType === 'create') {
          payload = item
          itemId = undefined // don't build a collection/:id endpoint from item itself during POST
        }

        isMounted &&
          logAndSetMeta(
            _objectSpread({}, meta, {
              isLoading: true,
            })
          )

        var resolve = function resolve(response) {
          try {
            var newData = response.data

            if (transform) {
              newData = transform(response.data)
              log('AFTER transform:', newData)
            } // these calls only are fired against non-collection endpoints

            if (transformItem) {
              newData = transformItem(newData)
              log('AFTER transformItem:', newData)
            } // short circuit for non-collection calls

            if (!isCollection) {
              log('non-collection action '.concat(actionType, ': setting data to'), item)

              if (actionType === 'remove') {
                onRemove(data)
                return isMounted && setData()
              }

              var updated = mergeOnUpdate ? (0, _deepmerge.default)(item, newData) : item
              actionType === 'replace' && onReplace(updated) // event

              actionType === 'update' && onUpdate(updated) // event

              isMounted && setData(updated)
              isMounted &&
                logAndSetMeta(
                  _objectSpread({}, meta, {
                    isLoading: false,
                    error: undefined,
                    key: getHash(),
                  })
                )
              return true
            }

            if (['update', 'replace'].includes(actionType)) {
              item = mergeOnUpdate ? (0, _deepmerge.default)(item, newData) : item
              log('updating item in internal collection', item)
              newData = data.map(function(i) {
                return getId(i) === itemId ? item : i
              })
              actionType === 'replace' && onReplace(item) // event

              actionType === 'update' && onUpdate(item) // event
            } else if (actionType === 'create') {
              item = mergeOnCreate ? (0, _deepmerge.default)(item, newData) : item
              log('adding item to internal collection', item)
              newData = [].concat((0, _toConsumableArray2.default)(data), [item])
              onCreate(item) // event
            } else if (actionType === 'remove') {
              log('deleting item from internal collection')
              newData = data.filter(function(i) {
                return getId(i) !== itemId
              })
              onRemove(item) // event
            } // update internal data

            isMounted && setData(newData)
            isMounted &&
              logAndSetMeta(
                _objectSpread({}, meta, {
                  isLoading: false,
                  key: getHash(),
                })
              )
          } catch (err) {
            handleError(err)
          }
        }

        log('calling "'.concat(method, '" to'), getEndpoint(endpoint, itemId), payload) // mock exit for success

        if (mock) {
          return (0, _lib.autoResolve)('Success!', {
            fn: resolve,
          })
        }

        return axios[method](getEndpoint(endpoint, itemId), payload)
          .then(resolve)
          .catch(handleError)
      }
    }

    var update = createActionType({
      actionType: 'update',
      method: 'patch',
    })
    var replace = createActionType({
      actionType: 'replace',
      method: 'put',
    })
    var remove = createActionType({
      actionType: 'remove',
      method: 'delete',
    })
    var create = createActionType({
      actionType: 'create',
      method: 'post',
    }) // data load function

    var load = function load() {
      var loadOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {}
      var opt = (0, _deepmerge.default)(options, loadOptions)
      var query = opt.query,
        loadOnlyOnce = opt.loadOnlyOnce
      var fetchEndpoint = getEndpoint(endpoint, id) // if query param is a function, run it to derive up-to-date params

      query = typeof query === 'function' ? query() : query
      log('GET', {
        endpoint: fetchEndpoint,
        query: query,
      })
      isMounted &&
        logAndSetMeta(
          _objectSpread({}, meta, {
            isLoading: true,
            error: undefined,
          })
        )
      fetchStore
        .get(fetchEndpoint, {
          params: query,
        })
        .then(function(_ref2) {
          var data = _ref2.data

          try {
            if ((0, _typeof2.default)(data) !== 'object') {
              return onError('ERROR: Response not in object form... response.data =', data)
            }

            log('GET RESPONSE:', data) // all data gets base transform

            if (transform) {
              data = transform(data)
              log('AFTER transform:', data)
            } // if collection, transform as collection

            if (isCollection && transformCollection) {
              data = transformCollection(data)
              log('AFTER transformCollection:', data)
            }

            if (transformItem) {
              if (isCollection && data && data.length) {
                data = data.map(transformItem)
              } else {
                data = transformItem(data)
              }

              log('AFTER transformItem:', data)
            }

            if (isMounted) {
              setData(data)
              !loadedOnce && setLoadedOnce(true)
              logAndSetMeta(
                _objectSpread({}, meta, {
                  filtered: data,
                  // set filtered to loaded data... useEffect will trigger re-render with filtered data
                  isLoading: false,
                  error: undefined,
                  key: getHash(),
                })
              )
              onLoad(data)
            }
          } catch (err) {
            handleError(err)
          }
        })
        .catch(handleError)
    } // EFFECT: UPDATE FILTERED DATA WHEN FILTER OR DATA CHANGES

    ;(0, _react.useEffect)(
      function() {
        // complete avoid this useEffect pass when no filter set or not working on collection
        if (!filter || !isCollection || !Array.isArray(data)) {
          return function() {}
        }

        log('filter changed on datahook', [filter, data])
        var filtered = data
        var prev = meta.filtered

        if (filter) {
          if (typeof filter === 'function') {
            filtered = data.filter(filter)
          } else {
            filtered = data.filter((0, _lib.objectFilter)(filter))
          }
        }

        var sameLength = filtered.length === prev.length
        var allMatched = filtered.reduce(function(acc, item) {
          return prev.includes(item) && acc
        }, true)

        if (!sameLength || !allMatched) {
          log('changes in filtered results detected, new filtered =', filtered)
          isMounted &&
            logAndSetMeta(
              _objectSpread({}, meta, {
                filtered: filtered,
                key: getHash(),
              })
            )
        }
      },
      [filter, data]
    ) // EFFECT: SET INITIAL LOAD, LOADING INTERVAL, ETC

    ;(0, _react.useEffect)(
      function() {
        log('react-use-rest: id changed:', id)

        var exit = function exit() {
          if (loadingInterval) {
            log('clearing load() interval', {
              interval: interval,
            })
            clearInterval(loadingInterval)
          }

          log('unmounting data hook')
          isMountedRef.current = false
        }

        if (!idExplicitlyPassed || (idExplicitlyPassed && id !== undefined)) {
          // bail if no longer mounted
          if (!isMounted || (loadOnlyOnce && loadedOnce)) {
            return exit
          }

          autoload && load()

          if (interval) {
            var loadingInterval = setInterval(load, interval)
          }
        }

        return exit
      },
      [id]
    )
    var loadFunction = eventable(load)
    return {
      data: data,
      filtered: meta.filtered,
      load: loadFunction,
      refresh: loadFunction,
      create: create,
      remove: remove,
      update: update,
      replace: replace,
      isLoading: meta.isLoading,
      error: meta.error,
      key: meta.key,
    }
  }
}

exports.createRestHook = createRestHook
