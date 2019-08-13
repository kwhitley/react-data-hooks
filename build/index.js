"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createRestHook = void 0;

var _react = require("react");

var _useStoreHook = require("use-store-hook");

var _axios = _interopRequireDefault(require("axios"));

var _deepmerge = _interopRequireDefault(require("deepmerge"));

var _utils = require("./utils");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

// helper function to assemble endpoint parts, joined by '/', but removes undefined attributes
var getEndpoint = function getEndpoint() {
  for (var _len = arguments.length, parts = new Array(_len), _key = 0; _key < _len; _key++) {
    parts[_key] = arguments[_key];
  }

  return parts.filter(function (p) {
    return p !== undefined;
  }).join('/');
}; // helper function to handle functions that may be passed a DOM event


var eventable = function eventable(fn) {
  return function () {
    var arg0 = (arguments.length <= 0 ? undefined : arguments[0]) || {};

    if (arg0.nativeEvent instanceof Event) {
      return fn();
    }

    return fn.apply(void 0, arguments);
  };
};

var createRestHook = function createRestHook(endpoint) {
  var createHookOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  return function () {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var id = args[0],
        hookOptions = args[1];
    var isMounted = true;
    var idExplicitlyPassed = args.length && _typeof(args[0]) !== 'object';

    if (_typeof(id) === 'object' && hookOptions === undefined) {
      // e.g. useHook({ something })
      hookOptions = id; // use first param as options

      id = undefined;
    } // local options are a blend of factory options and instantiation options


    var options = (0, _deepmerge["default"])(createHookOptions, hookOptions || {}); // extract options

    var _options$autoload = options.autoload,
        autoload = _options$autoload === void 0 ? true : _options$autoload,
        _options$axios = options.axios,
        axios = _options$axios === void 0 ? _axios["default"] : _options$axios,
        filter = options.filter,
        _options$getId = options.getId,
        getId = _options$getId === void 0 ? function (item) {
      return item.id;
    } : _options$getId,
        initialValue = options.initialValue,
        interval = options.interval,
        isCollection = options.isCollection,
        log = options.log,
        _options$onAuthentica = options.onAuthenticationError,
        onAuthenticationError = _options$onAuthentica === void 0 ? function () {} : _options$onAuthentica,
        _options$onCreate = options.onCreate,
        onCreate = _options$onCreate === void 0 ? function () {} : _options$onCreate,
        _options$onError = options.onError,
        onError = _options$onError === void 0 ? function () {} : _options$onError,
        _options$onLoad = options.onLoad,
        onLoad = _options$onLoad === void 0 ? function () {} : _options$onLoad,
        _options$onRemove = options.onRemove,
        onRemove = _options$onRemove === void 0 ? function () {} : _options$onRemove,
        _options$onReplace = options.onReplace,
        onReplace = _options$onReplace === void 0 ? function () {} : _options$onReplace,
        _options$onUpdate = options.onUpdate,
        onUpdate = _options$onUpdate === void 0 ? function () {} : _options$onUpdate,
        _options$mergeOnCreat = options.mergeOnCreate,
        mergeOnCreate = _options$mergeOnCreat === void 0 ? true : _options$mergeOnCreat,
        _options$mergeOnUpdat = options.mergeOnUpdate,
        mergeOnUpdate = _options$mergeOnUpdat === void 0 ? true : _options$mergeOnUpdat,
        mock = options.mock,
        _options$query = options.query,
        query = _options$query === void 0 ? {} : _options$query,
        transform = options.transform; // if isCollection not explicitly set, try to derive from arguments

    if (!options.hasOwnProperty('isCollection')) {
      // for collections, clear id, and derive options from first param
      if (idExplicitlyPassed) {
        // e.g. useHook('foo') useHook(3)
        isCollection = false;
      } else {
        isCollection = true;
      }
    }

    log && log('creating hook', {
      endpoint: endpoint,
      id: id,
      idExplicitlyPassed: idExplicitlyPassed,
      isCollection: isCollection,
      options: options,
      args: args
    }); // initialValue defines the initial state of the data response ([] for collection queries, or undefined for item lookups)

    initialValue = options.hasOwnProperty('initialValue') ? initialValue : isCollection ? [] : undefined;
    var key = 'resthook:' + endpoint + JSON.stringify(args);

    var _useStore = (0, _useStoreHook.useStore)(key, initialValue, options),
        _useStore2 = _slicedToArray(_useStore, 2),
        data = _useStore2[0],
        setData = _useStore2[1];

    var _useState = (0, _react.useState)(autoload),
        _useState2 = _slicedToArray(_useState, 2),
        isLoading = _useState2[0],
        setIsLoading = _useState2[1];

    var _useState3 = (0, _react.useState)(undefined),
        _useState4 = _slicedToArray(_useState3, 2),
        error = _useState4[0],
        setError = _useState4[1];

    var handleError = function handleError(error) {
      log && log('handleError executed', error);
      isMounted && setIsLoading(false);
      isMounted && setError(error.message || error);
      onError && onError(error); // handle authentication errors

      if (onAuthenticationError && [401, 403].includes(error.status)) {
        onAuthenticationError(error);
      }
    };

    var createActionType = function createActionType() {
      var actionOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      return function (item, oldItem) {
        var itemId = id || getId(item);
        var _actionOptions$action = actionOptions.actionType,
            actionType = _actionOptions$action === void 0 ? 'update' : _actionOptions$action,
            _actionOptions$method = actionOptions.method,
            method = _actionOptions$method === void 0 ? 'patch' : _actionOptions$method;
        var payload = undefined;
        console.log(actionType.toUpperCase(), 'on', item, 'with id', itemId);

        if (!itemId && actionType !== 'create') {
          return (0, _utils.autoReject)("Could not ".concat(actionType, " item (see log)"), {
            fn: function fn() {
              console.error('option.getId(item) did not return a valid ID', item);
            }
          });
        }

        if (['update', 'replace'].includes(actionType)) {
          var changes = (0, _utils.getPatch)(item, oldItem);
          var isPatch = actionType === 'update';

          if (!Object.keys(changes).length) {
            return (0, _utils.autoReject)('No changes to save');
          }

          payload = isPatch ? changes : item;
        }

        if (actionType === 'create') {
          payload = item;
        }

        isMounted && setIsLoading(true);

        var resolve = function resolve(response) {
          try {
            isMounted && setIsLoading(false); // short circuit for non-collection calls

            if (!isCollection) {
              log && log("non-collection action ".concat(actionType, ": setting data to"), item);

              if (actionType === 'remove') {
                return isMounted && setData();
              }

              var updated = mergeOnUpdate ? response.data : item;
              onUpdate && onUpdate(item);
              return isMounted && setData(updated);
            }

            var newData = data;

            if (['update', 'replace'].includes(actionType)) {
              item = mergeOnUpdate ? response.data || item : item;
              log && log('updating item in internal collection');
              newData = data.map(function (i) {
                return getId(i) === itemId ? item : i;
              });
              actionType === 'replace' && onReplace && onReplace(item);
              actionType === 'update' && onUpdate && onUpdate(item);
            } else if (actionType === 'create') {
              item = mergeOnCreate ? response.data || item : item;
              log && log('adding item to internal collection');
              newData = [].concat(_toConsumableArray(data), [item]);
              onCreate && onCreate(item);
            } else if (actionType === 'remove') {
              log && log('deleting item from internal collection');
              newData = data.filter(function (i) {
                return getId(i) !== itemId;
              });
              onRemove && onRemove(item);
            } // update internal data


            isMounted && setData(newData);
          } catch (err) {
            onError && onError(err);
            isMounted && setError(err.message);
          }
        };

        log && log("calling \"".concat(method, "\" to"), getEndpoint(endpoint, itemId), payload); // mock exit for success

        if (mock) {
          return (0, _utils.autoResolve)('Success!', {
            fn: resolve
          });
        }

        return axios[method](getEndpoint(endpoint, itemId), payload).then(resolve)["catch"](function (err) {
          return handleError(err.response);
        });
      };
    };

    var update = createActionType({
      actionType: 'update',
      method: 'patch'
    });
    var replace = createActionType({
      actionType: 'replace',
      method: 'put'
    });
    var remove = createActionType({
      actionType: 'remove',
      method: 'delete'
    });
    var create = createActionType({
      actionType: 'create',
      method: 'post'
    }); // data load function

    var load = function load() {
      var loadOptions = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var opt = (0, _deepmerge["default"])(options, loadOptions);
      var query = opt.query,
          transform = opt.transform; // if query param is a function, run it to derive up-to-date params

      query = typeof query === 'function' ? query() : query;
      log && log('GET', {
        endpoint: endpoint,
        query: query
      }); // only lock with loading when not pre-populated

      !isLoading && isMounted && setIsLoading(true);
      error && isMounted && setError(undefined);
      axios.get(getEndpoint(endpoint, id), {
        params: query
      }).then(function (_ref) {
        var data = _ref.data;

        try {
          log && log('GET RESPONSE:', data); // dig into nested payloads if required

          data = data.data || data;

          if (transform) {
            data = transform(data);
          }

          if (filter) {
            if (typeof filter === 'function') {
              data = data.filter(filter);
            } else {
              data = data.filter((0, _utils.objectFilter)(filter));
            }
          }

          if (isMounted) {
            setData(data);
            setIsLoading(false);
            onLoad && onLoad(data);
          }
        } catch (err) {
          onError && onError(err);
          isMounted && setError(err.message);
        }
      })["catch"](function (err) {
        handleError(err.response);
        setError(err.message);
        setData(initialValue);
      });
    }; // automatically load data upon component load and set up intervals, if defined


    (0, _react.useEffect)(function () {
      log && log('react-use-rest: [id] changed:', id);

      if (!idExplicitlyPassed || idExplicitlyPassed && id !== undefined) {
        autoload && load();

        if (interval) {
          var loadingInterval = setInterval(load, interval);
        }
      }

      return function () {
        if (loadingInterval) {
          log && log('clearing load() interval', {
            interval: interval
          });
          clearInterval(loadingInterval);
        }

        isMounted = false;
      };
    }, [id]);
    return {
      data: data,
      setData: setData,
      load: eventable(load),
      refresh: eventable(load),
      create: create,
      remove: remove,
      update: update,
      replace: replace,
      isLoading: isLoading,
      error: error
    };
  };
};

exports.createRestHook = createRestHook;