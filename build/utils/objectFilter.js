"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.objectFilter = void 0;

var objectFilter = function objectFilter() {
  var filter = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  return function () {
    var obj = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    return Object.keys(filter).reduce(function (out, key) {
      return out && filter[key] === obj[key];
    }, true);
  };
};

exports.objectFilter = objectFilter;