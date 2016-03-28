import * as Promise from "bluebird"
import {tryCatch, errorObj} from "./util"
import {Runtime} from "./runtime"
import {Message} from "./message"
import * as symbols from "./symbols"

export class Spawnable{
  private _iter:IterableIterator<Promise<any>>
  private _runtime: Runtime
  private _yielding: Symbol = symbols.init
  private _yieldedPromise: Promise<any>
  private _name:string
  private _mailbox = []

  public constructor(runtime: Runtime, iter: IterableIterator<Promise<any>>, name: string) {
    this._runtime = runtime;
    this._iter = iter;
    this._name = name;
  }

  public get name(): string {
    return this._name
  }

  _continue() {
    let result;
    switch (this._yielding) {
      case symbols.init:
        result = tryCatch(this._iter.next, this._iter)
        if (result == errorObj) {
          this._cleanup(result.e);
          return
        }
        break;
      case symbols.message:
        let msg = this._mailbox.pop();
        result = tryCatch(this._iter.next, this._iter,[msg])
        break;
      case symbols.context:
        break;
      case symbols.promise:
        result = this._getResult()
    }

    if (result.done) {
      this._cleanup(null)
      return;
    }

    switch (result.value) {
      case symbols.message:
        this._yielding = symbols.message;
        if (this._mailbox.length > 0) {
          this._runtime._ready(this);
        }
        break;
      case symbols.context:
        this._yielding = symbols.context;
        this._runtime._ready(this);
        break;
      default:
        if (result.value instanceof Promise) {
          this._yielding = symbols.promise;
          this._yieldedPromise = result.value;
          if (!result.value.isPending()) {
            this._runtime._ready(this);
          }
          else {
            result.value.then(() => {
              this._runtime._ready(this);
            })
          }
        }
    }
  }

  private _getResult(){
    let iterable = this._iter;
    let promise = this._yieldedPromise;
    this._yieldedPromise = null;
    if (promise.isFulfilled()){
      return tryCatch(iterable.next, iterable, [promise.value()])
    }
    else if (promise.isRejected()){
      return tryCatch(iterable.throw, iterable, [promise.reason()])
    }
    else{ // yielded.cancaled() not support yet
      return tryCatch(iterable.throw,iterable,[new Error("Cancel not support yet")]);
    }
  }

  private _cleanup(reason:Error){
    this._runtime._exit(this);
  }

  _receive(msg: Message) {
    this._mailbox.push(msg)
    if (this._yielding == symbols.message) {
      this._runtime._ready(this)
    }
  }
}
