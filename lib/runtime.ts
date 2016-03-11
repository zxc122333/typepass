import {Spawnable} from "./spawnable";
import * as _ from "lodash"
import * as utils from "./util"

@utils.Defaults
export class RuntimeConfigure{
    public id = "tp#"+((Math.random() * 10000)<<0)
    public localHost:string = "0.0.0.0"
    public localPort:number = 13901
}

export class Runtime{
  private _id:string = null;
  private _localHost:string = null;
  private _localPort:number = 0;

  constructor(config:RuntimeConfigure){
    config = <RuntimeConfigure>_.defaults(config,new RuntimeConfigure)
    this._id = config.id
    this._localHost = config.localHost
    this._localPort = config.localPort
  }

  public get id(){return this._id}
  public get localHost(){return this._localHost}
  public get localPort(){return this._localPort}

  private _actors = new Map<string,Spawnable>()
  private _waitings = new Set<Spawnable>()
  private _nextId = 0
  private _awake = false

  spawn(iter:IterableIterator<any>,name?:string){
    if(name && name[0]=="$"){
      throw new Error("user define actor name should not start with '$'")
    }
    if(!name || name == ""){
      name = "$"+this._nextId++
    }
    if(this._actors.has(name)){
      throw new Error(`actor name with ${name} is already exist`)
    }
    let actor = new Spawnable(this,iter,name)
    this._actors.set(name,actor)
    this._ready(actor);
    return actor
  }
  _ready(actor:Spawnable){
    this._waitings.add(actor)

    if(!this._awake){
      this._awake = true;
      process.nextTick(()=>this._weakup())
    }
  }
  _weakup(){
    for(let actor of this._waitings){
      this._waitings.delete(actor);
      actor._continue()
    }
    this._awake = false;
  }
  _exit(actor:Spawnable){
    this._actors.delete(actor.name)
  }
}
