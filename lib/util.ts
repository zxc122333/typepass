import * as Promise from "bluebird"
import * as _ from "lodash"

export let errorObj = {e:{}}

export function tryCatch(fn,scope?:any,args?:Array<any>){
  try {
      return fn.apply(scope, args)
  } catch (e) {
      errorObj.e = e
      return errorObj
  }
}

export function Defaults(target){
  
  return target
}
