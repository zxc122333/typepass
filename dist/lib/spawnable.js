"use strict";
const Promise = require("bluebird");
const util_1 = require("./util");
const symbols = require("./symbols");
class Spawnable {
    constructor(runtime, iter, name) {
        this._yielding = symbols.init;
        this._mailbox = [];
        this._runtime = runtime;
        this._iter = iter;
        this._name = name;
    }
    get name() {
        return this._name;
    }
    _continue() {
        let result;
        switch (this._yielding) {
            case symbols.init:
                result = util_1.tryCatch(this._iter.next, this._iter);
                if (result == util_1.errorObj) {
                    this._cleanup(result.e);
                    return;
                }
                break;
            case symbols.message:
                break;
            case symbols.context:
                break;
            case symbols.promise:
                result = this._getResult();
        }
        if (result.done) {
            this._cleanup(null);
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
                        });
                    }
                }
        }
    }
    _getResult() {
        let iterable = this._iter;
        let promise = this._yieldedPromise;
        this._yieldedPromise = null;
        if (promise.isFulfilled()) {
            return util_1.tryCatch(iterable.next, iterable, [promise.value()]);
        }
        else if (promise.isRejected()) {
            return util_1.tryCatch(iterable.throw, iterable, [promise.reason()]);
        }
        else {
            return util_1.tryCatch(iterable.throw, iterable, [new Error("Cancel not support yet")]);
        }
    }
    _cleanup(reason) {
        this._runtime._exit(this);
    }
    _receive(msg) {
        this._mailbox.push(msg);
        if (this._yielding == symbols.message) {
            this._runtime._ready(this);
        }
    }
}
exports.Spawnable = Spawnable;
