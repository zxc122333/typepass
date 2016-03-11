"use strict";
const util_1 = require("./util");
class Spawnable {
    constructor(runtime, iter, name) {
        this._mailbox = new Set();
        this._runtime = runtime;
        this.name = name;
        this._iter = iter;
    }
    get path() {
        return this._runtime.id + "/" + this.name;
    }
    _continue() {
        let result;
        if (!this._yieldedPromise) {
            result = util_1.tryCatch(this._iter.next, this._iter);
        }
        else {
            result = this._getResult();
        }
        if (result == util_1.errorObj) {
            this._cleanup(result.e);
            return;
        }
        if (result.done) {
            this._cleanup(null);
            return;
        }
        let promise = this._yieldedPromise = result.value;
        if (!promise.isPending()) {
            this._runtime._ready(this);
        }
        else {
            promise.then(() => {
                this._runtime._ready(this);
            });
        }
    }
    _getResult() {
        let iterable = this._iter;
        let yielded = this._yieldedPromise;
        this._yieldedPromise = null;
        if (yielded.isFulfilled()) {
            return util_1.tryCatch(iterable.next, iterable, [yielded.value()]);
        }
        else if (yielded.isRejected()) {
            return util_1.tryCatch(iterable.throw, iterable, [yielded.reason()]);
        }
        else {
            return util_1.tryCatch(iterable.throw, iterable, [new Error("Cancel not support yet")]);
        }
    }
    _cleanup(reason) {
        this._runtime._exit(this);
    }
}
exports.Spawnable = Spawnable;
