"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const spawnable_1 = require("./spawnable");
const _ = require("lodash");
const utils = require("./util");
let RuntimeConfigure = class RuntimeConfigure {
    constructor() {
        this.id = "tp#" + ((Math.random() * 10000) << 0);
        this.localHost = "0.0.0.0";
        this.localPort = 13901;
    }
};
RuntimeConfigure = __decorate([
    utils.Defaults, 
    __metadata('design:paramtypes', [])
], RuntimeConfigure);
exports.RuntimeConfigure = RuntimeConfigure;
class Runtime {
    constructor(config) {
        this._id = null;
        this._localHost = null;
        this._localPort = 0;
        this._actors = new Map();
        this._waitings = new Set();
        this._nextId = 0;
        this._awake = false;
        config = _.defaults(config, new RuntimeConfigure);
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
