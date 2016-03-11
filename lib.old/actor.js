"use strict";
var EventEmitter = require("events")
var util = require("util")
var _util= require("./util")
var tryCatch = _util.tryCatch;
var _ = require("lodash")
var ASSERT = require("assert")
var Promise = require("bluebird")
var tryCatch = _util.tryCatch;

var waitMessage = Symbol("waitMessage")
function Actor(runtime,iterable,name){
  this.runtime = runtime;
  this._iterable = iterable;
  this.name = name;
  this.ref = runtime.address+"/"+name;
  this._yieldedPromise = null;
  this._mailbox = new Set();
}

Actor.prototype._continue = function(){
  var yielded = this._yieldedPromise;
  if(!yielded){
    return this._procNextResult(tryCatch(this._iterable.next,this._iterable)
  }
  if(yielded.isPending()){
    return;
  }
  this._procNextResult(this._getResult(yielded))
}

Actor.prototype._getResult = function(yielded){
  var iterable = this._iterable;

  if(yielded.isFulfilled()){
    return tryCatch(iterable.next,iterable,[yielded.value()]);
  }
  if(yielded.isRejected()){
    return tryCatch(iterable.throw,iterable,[yielded.reason()]);
  }
  if(yielded.isCanceled()){
    // TODO: nodejs v5.x doesn't support `return` yet,reject for now
    return tryCatch(iterable.throw,iterable,[new Error("Cancel not support yet")]);
  }
}

Actor.prototype._procNextResult = function(result){
  if(result == _util.errorObj){
    this._cleanup(result.e);
    this.runtime._exit(this);
    return
  }

  let value = result.value;
  if(result.done){
    this._cleanup();
    this.runtime._exit(this);
    return
  }

  // promise
  let maybePromise = yieldHandler.handle(value,this)
  if(maybePromise == yieldHandler.errorObj){
    this.runtime._exit(this)
    return;
  }
  this._yieldedPromise = maybePromise;
  if(!maybePromise.isPending()){
    this.runtime._ready(this);
  }
  else{
    maybePromise._setAsyncGuaranteed()
    maybePromise.then(this.weakup,this.weakup);
  }
}

Actor.prototype._message = function(msg){
  this._mailbox.add(msg);
  if(this._yieldedPromise == waitMessage){
    this._runtime._ready(this)
  }
}

Actor.prototype.tell = function(targetRef,msg){
  this.runtime._sendMessage(this.ref,targetRef,msg)
}
