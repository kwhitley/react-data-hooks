'use strict'

var _interopRequireDefault = require('@babel/runtime/helpers/interopRequireDefault')

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.FetchStore = void 0

var _classCallCheck2 = _interopRequireDefault(
  require('@babel/runtime/helpers/classCallCheck')
)

var _defineProperty2 = _interopRequireDefault(
  require('@babel/runtime/helpers/defineProperty')
)

var _fetchAxios = require('./fetch-axios')

var FetchStore = function FetchStore() {
  var _this = this

  ;(0, _classCallCheck2.default)(this, FetchStore)
  ;(0, _defineProperty2.default)(this, 'fetches', {})
  ;(0, _defineProperty2.default)(this, 'fetcher', _fetchAxios.fetchAxios)
  ;(0, _defineProperty2.default)(this, 'debounce', 100)
  ;(0, _defineProperty2.default)(this, 'setAxios', function(axios) {
    _this.fetcher = axios
    return _this
  })
  ;(0, _defineProperty2.default)(this, 'setDebounce', function(value) {
    _this.debounce = value
  })
  ;(0, _defineProperty2.default)(this, 'setExpiration', function(key) {
    var fetchEntry = _this.fetches[key] || {}
    var expires = fetchEntry.expires

    if (expires) {
      clearTimeout(expires)
    }

    fetchEntry.expires = setTimeout(function() {
      return _this.expireFetch(key)
    }, _this.debounce)
  })
  ;(0, _defineProperty2.default)(this, 'get', function() {
    for (
      var _len = arguments.length, args = new Array(_len), _key = 0;
      _key < _len;
      _key++
    ) {
      args[_key] = arguments[_key]
    }

    var key = JSON.stringify(args)
    var fetchEntry = _this.fetches[key]

    if (fetchEntry) {
      _this.setExpiration(key)
    }

    if (!fetchEntry) {
      var _this$fetcher

      fetchEntry = _this.fetches[key] = {
        fetch: (_this$fetcher = _this.fetcher).get.apply(_this$fetcher, args),
      }

      _this.setExpiration(key)
    }

    return fetchEntry.fetch
  })
  ;(0, _defineProperty2.default)(this, 'expireFetch', function(key) {
    delete _this.fetches[key]
  })
}

exports.FetchStore = FetchStore
