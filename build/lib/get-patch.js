'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true,
})
exports.getPatch = void 0

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
