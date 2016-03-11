"use strict";
let zc = require("..")
let Promise = require("bluebird")
let _util = require("./util")
let _ = require("lodash")
let handlers = [];

handlers.push(function(value,owner){
  if(value == zc.symbolCurrent){
    return Promise.resolve(owner)
  }
})

exports.handle = function(value,owner){
  let maybePromise = tryConvertToPromise(value);
  if (maybePromise instanceof Promise) return maybePromise;

  for(let i = 0;i< handlers.length;i++){
    let result = _util.tryCatch(handlers[i],null,[value,owner]);
    if(result == _util.errorObj){
      return Promise.reject(errorObj.e)
    }
    maybePromise = tryConvertToPromise(result);
    if (maybePromise instanceof Promise) return maybePromise;
  }
  return null;
}

exports.handlers = handlers

function tryConvertToPromise(obj){
  if(!_.isObject(obj)){
    return obj;
  }
  if (obj instanceof Promise) return obj;
  let then = _util.tryCatch(()=>obj.then);
  if(then == _util.errorObj){
    return Promise.reject(then.e)
  }
  if(typeof then !=='function'){
    return obj;
  }
  // do thenable
  let defer = Promise.defer();
  let synchronous = true;
  let result = _util.tryCatch(then,obj,[(value)=>{
    if(!defer)return;
    defer.resolve(value);
    defer = null;
  },(reason)=>{
    if(!defer)return;
    defer.reject(reason);
    defer = null;
  }])

  if(defer && result == _util.errorObj){
    defer.reject(result.e)
    defer = null;
  }

  synchronous = false;
  return defer.promise;
}
