"use strict";
let symbol = require("./symbol")
function ActorRef(actor){
  this[symbol.actor] = actor;
  this[symbol.runtime] = actor.runtime;
  this.name = actor.name
}

ActorRef.prototype.tall = function(msg){
  this[symbol.actor]._message(msg)
}

ActorRef.prototype.link = function(){
  
}

module.exports = ActorRef;
