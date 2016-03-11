"use strict";

import * as typepass from "../lib/runtime"
import * as Promise from "bluebird"
let runtime = new typepass.Runtime(new typepass.RuntimeConfigure("","",123))

function sleep(ms:number){
  return new Promise((resolve)=>{
    setTimeout(resolve,ms)
  })
}

runtime.spawn(function*(){
  console.log(1);
  yield sleep(1000)
  console.log(2);
}())

console.log(3)
