"use strict";
exports.errorObj = { e: {} };
function tryCatch(fn, scope, args) {
    try {
        return fn.apply(scope, args);
    }
    catch (e) {
        exports.errorObj.e = e;
        return exports.errorObj;
    }
}
exports.tryCatch = tryCatch;
function Defaults(target) {
    return target;
}
exports.Defaults = Defaults;
