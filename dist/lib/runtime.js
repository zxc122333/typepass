"use strict";
const spawnable_1 = require("./spawnable");
const _ = require("lodash");
class Runtime {
    constructor(config) {
        this._id = null;
        this._localHost = null;
        this._localPort = 0;
        this._actors = new Map();
        this._waitings = new Set();
        this._nextId = 0;
        this._awake = false;
        _.defaults(config || {}, {
            id: ""
        });
        this._id = config.id;
        this._localHost = config.localHost;
        this._localPort = config.localPort;
    }
    get id() { return this._id; }
    get localHost() { return this._localHost; }
    get localPort() { return this._localPort; }
    spawn(iter, name) {
        if (name && name[0] == "$") {
            throw new Error("user define actor name should not start with '$'");
        }
        if (!name || name == "") {
            name = "$" + this._nextId++;
        }
        if (this._actors.has(name)) {
            throw new Error(`actor name with ${name} is already exist`);
        }
        let actor = new spawnable_1.Spawnable(this, iter, name);
        this._actors.set(name, actor);
        this._ready(actor);
        return actor;
    }
    _ready(actor) {
        this._waitings.add(actor);
        if (!this._awake) {
            this._awake = true;
            process.nextTick(() => this._weakup());
        }
    }
    _weakup() {
        for (let actor of this._waitings) {
            this._waitings.delete(actor);
            actor._continue();
        }
        this._awake = false;
    }
    _exit(actor) {
        this._actors.delete(actor.name);
    }
}
exports.Runtime = Runtime;
