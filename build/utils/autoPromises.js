"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.autoReject = exports.autoResolve = exports.resolveReject = void 0;

// helper function to return an instantly resolved or rejected promise
var resolveReject = function resolveReject(resolution) {
  return function (msg) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
      timeout: undefined,
      fn: undefined
    };
    return new Promise(function (resolve, reject) {
      setTimeout(function () {
        options.fn && options.fn();
        resolution === 'resolve' ? resolve(msg) : reject(msg);
      }, options.timeout);
    });
  };
};

exports.resolveReject = resolveReject;
var autoResolve = resolveReject('resolve');
exports.autoResolve = autoResolve;
var autoReject = resolveReject('reject');
exports.autoReject = autoReject;