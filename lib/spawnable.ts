import {Runtime} from "./runtime";
import {tryCatch,errorObj} from "./util"
import * as Promise from "bluebird"

export class Spawnable{

  public name:string
  public get path():string{
    return this._runtime.id + "/" + this.name;
  }

  public constructor(runtime:Runtime,iter:IterableIterator<Promise<any>>,name:string){
    this._runtime = runtime;
    this.name = name;
    this._iter = iter;
  }

  public _continue(){
    let result;
    if(!this._yieldedPromise){
      result = tryCatch(this._iter.next,this._iter)
    }
    else{
      result = this._getResult()
    }

    if(result == errorObj){
      this._cleanup(result.e);
      return
    }

    if(result.done){
      this._cleanup(null)
      return;
    }

    let promise = this._yieldedPromise = <Promise<any>>result.value;
    if(!promise.isPending()){
      this._runtime._ready(this);
    }
    else{
      promise.then(()=>{
        this._runtime._ready(this);
      })
    }
  }

  private _iter:IterableIterator<Promise<any>>
  private _runtime:Runtime
  private _yieldedPromise:Promise<any>
  private _mailbox = new Set<any>()

  private _getResult(){
    let iterable = this._iter;
    let yielded = this._yieldedPromise;
    this._yieldedPromise = null;
    if(yielded.isFulfilled()){
      return tryCatch(iterable.next,iterable,[yielded.value()])
    }
    else if(yielded.isRejected()){
      return tryCatch(iterable.throw,iterable,[yielded.reason()])
    }
    else{ // yielded.cancaled() not support yet
      return tryCatch(iterable.throw,iterable,[new Error("Cancel not support yet")]);
    }
  }

  private _cleanup(reason:Error){
    this._runtime._exit(this);
  }
}
