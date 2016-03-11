"use strict";
let util = require("util")
let Promise = require("bluebird")
let Actor = require("./actor");

function Runtime(options){
  this._actors = new Map();
  this._actorId = 0;
  this._readySet = new Set();
  this._nextWeakup = false;
}

Runtime.prototype.start = function(){

}

Runtime.prototype.stop = function(){

}

Runtime.prototype.spawn = function(iterable,name){
  if(name && name[0] === "$"){
    throw new Error("user define actor name should not start with '$'");
  }
  if(!name || name === ""){
    name = ""+this._actorId++;
  }
  if(this._actors.has(name)){
    throw new Error(`actor name with ${name} is already exist`);
  }
  var actor = new Actor(iterable,name)
  this._actors.add(name,actor)
  this._ready(actor);
  return actor.ref;
}

Runtime.prototype._ready = function(actor){
  this._readySet.add(actor);
  if(!this._nextWeakup){
    process.nextTick(()=>this._weakup());
  }
}

Runtime.prototype._exit = function(actor){
  this._actors.delete(actor);
}

Runtime.prototype._weakup = function(){
  for(var actor of this._readySet){
    this._readySet.delete(actor);
    actor._continue();
  }
  this._nextWeakup = false;
}

Runtime.prototype._fetch = function(name){
  return this._actors.get(name)
}
