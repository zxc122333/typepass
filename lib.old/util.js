var ASSERT = require("assert")
var Promise = require("bluebird")
var errorObj = {e:{}}

exports.tryCatch = function tryCatch(fn,scope,args){
  try {
      return fn.apply(scope, args)
  } catch (e) {
      errorObj.e = e
      return errorObj
  }
}
exports.errorObj = errorObj
