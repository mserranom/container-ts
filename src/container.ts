///<reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts"/>
///<reference path='../node_modules/immutable/dist/immutable.d.ts'/>
import Immutable = require('immutable');

import "reflect-metadata";

export interface IInjector {
    add(item : any) : void;
    get(clazz : Function) : any;
    init() : void;
    destroy() : void;
}

class Container implements IInjector {
    
  public static instance : Container = new Container();
 
  private _content : Immutable.Map<Function, any> = Immutable.Map<Function, any>();
  
  add(item : any) : void{
    this._content = this._content.set(item.constructor, item);
  }
  
  get(clazz : Function) : any {
    return this._content.get(clazz);
  }
  
  init() : void {
      this.resolveInjections();
      this.postConstruct();
  }
  
  resolveInjections() : void {
      let resolveInjection = function (item : any) {
        if(item.__resolveDependencies) {
            item.__resolveDependencies(item);
        }  
      };
      this._content.valueSeq().forEach((item : any) => resolveInjection(item));
  }
  
  postConstruct() : void {
      let resolvePostConstruct = function (item : any) {
        if(item.__resolvePostconstruct) {
            item.__resolvePostconstruct(item);
        }  
      };
      this._content.valueSeq().forEach((item : any) => resolvePostConstruct(item));
  }
  
  destroy() {
      let resolveDestroy = function (item : any)  {
        if(item.__resolveDestroy) {
            item.__resolveDestroy(item);
        }  
      };
      this._content.valueSeq().forEach((item : any) => resolveDestroy(item));  
      this._content = Immutable.Map<Function, any>();   
  }
}

export function PostConstruct(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    if(!target['__postconstructs']) {
        target.__postconstructs = [];   
        target.__resolvePostconstruct = (self : any) => {
            target.__postconstructs.forEach((postConstructFunc : Function) => { postConstructFunc(self) } );
        };     
    }
    target.__postconstructs.push( (self : any) => { self[propertyKey]() });
    return descriptor;
}

export function Destroy(target: any, propertyKey: string, descriptor: TypedPropertyDescriptor<any>) {
    if(!target['__destroys']) {
        target.__destroys = [];   
        target.__resolveDestroy = (self : any) => {
            target.__destroys.forEach((destroyFunc : Function) => destroyFunc(self));
        };     
    }
    target.__destroys.push( (self : any) => { self[propertyKey]() });
    return descriptor;
}

export function Inject(ctorFactory : any) {
    return function(target: any, propertyKey: any) {
        if(!target['__injections']) {
            target.__injections = [];   
            target.__resolveDependencies = (self : any) => {
                target.__injections.forEach((resolveFunc : Function) => resolveFunc(self));
            };     
        }
        
        let resolveFunction = (self : any) => {
            let instance = Container.instance.get(ctorFactory())
            if(instance == null || instance == undefined) {
                throw 'unable to resolve injection';
            }
            self[propertyKey] = instance;  
        };
        
        target.__injections.push(resolveFunction);
    }
}

export function Injector(target: any, propertyKey: any) {
        target[propertyKey] = Container.instance;   
}
