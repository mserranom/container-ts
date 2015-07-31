///<reference path="../node_modules/reflect-metadata/reflect-metadata.d.ts"/>
///<reference path='../node_modules/immutable/dist/immutable.d.ts'/>
import Immutable = require('immutable');

import "reflect-metadata";

export interface Container {
    add(item:any) : void;
    add(item:any, name : string) : void;
    get(clazz:Function) : any;
    get(name:string) : any;
    init() : void;
    destroy() : void;
}

export class ContainerBuilder {
    static create() : Container {
        return new ContainerImpl();
    }
}

class ContainerImpl implements Container {

    private _contentByCtor:Immutable.Map<Function, any> = Immutable.Map<Function, any>();
    private _contentByName:Immutable.Map<string, any> = Immutable.Map<string, any>();

    add(item:any, name?:string):void {
        if(name) {
            this._contentByName = this._contentByName.set(name, item);
        }
        else {
            this._contentByCtor = this._contentByCtor.set(item.constructor, item);
        }
    }

    get(selector:any):any {
        if(typeof selector === "string" || selector instanceof String) {
            return this._contentByName.get(selector);
        }else {
            return this._contentByCtor.get(selector);
        }
    }

    init():void {
        this.resolveInjections();
        this.postConstruct();
    }

    resolveInjections():void {
        let resolveInjection = (item:any) => {
            if (item.__resolveDependencies) {
                item.__resolveDependencies(item, this);
            }
        };
        this.getAll().forEach((item:any) => resolveInjection(item));
    }

    postConstruct():void {
        let resolvePostConstruct = function (item:any) {
            if (item.__resolvePostconstruct) {
                item.__resolvePostconstruct(item);
            }
        };
        this.getAll().forEach((item:any) => resolvePostConstruct(item));
    }

    destroy() {
        let resolveDestroy = function (item:any) {
            if (item.__resolveDestroy) {
                item.__resolveDestroy(item);
            }
        };
        this.getAll().forEach((item:any) => resolveDestroy(item));
        this._contentByCtor = Immutable.Map<Function, any>();
        this._contentByName = Immutable.Map<string, any>();
    }

    private getAll() : Immutable.Iterable<any, any> {
        return this._contentByCtor.valueSeq().concat(this._contentByName.valueSeq());
    }
}

export function PostConstruct(target:any, propertyKey:string, descriptor:any) {
    if (!target['__postconstructs']) {
        target.__postconstructs = [];
        target.__resolvePostconstruct = (self:any) => {
            target.__postconstructs.forEach((postConstructFunc:Function) => {
                postConstructFunc(self)
            });
        };
    }
    target.__postconstructs.push((self:any) => {
        self[propertyKey]()
    });
    return descriptor;
}

export function Destroy(target:any, propertyKey:string, descriptor:any) {
    if (!target['__destroys']) {
        target.__destroys = [];
        target.__resolveDestroy = (self:any) => {
            target.__destroys.forEach((destroyFunc:Function) => destroyFunc(self));
        };
    }
    target.__destroys.push((self:any) => {
        self[propertyKey]()
    });
    return descriptor;
}

export function Inject(parameter:any) {
    return function (target:any, propertyKey:any) {
        if (!target['__injections']) {
            target.__injections = [];
            target.__resolveDependencies = (self:any, container : Container) => {
                target.__injections.forEach((resolveFunc:Function) => resolveFunc(self, container));
            };
        }

        let resolveFunction = (self:any, container : ContainerImpl) => {
            let query = (typeof parameter === "string" || parameter instanceof String) ? parameter : parameter();
            let instance = container.get(query);
            if (instance == null || instance == undefined) {
                throw 'unable to resolve injection';
            }
            self[propertyKey] = instance;
        };

        target.__injections.push(resolveFunction);
    }
}
