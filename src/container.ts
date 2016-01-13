///<reference path='./lib/immutable.d.ts'/>

"use strict"

import Immutable = require('immutable');


// ------------------
// SUPPORT
// ------------------


let isFunction = (obj : any) => !!(obj && obj.constructor && obj.call && obj.apply);

function createNew(ctor : any) {
    return new (Function.prototype.bind.apply(ctor, arguments));
}

const CONSTRUCTOR_PARAMETERS_PROP = '__cntnr__constructorInjections';

interface ConstructorDescriptor {
    name : string;
    params : Array<string>;
    ctor : (...params : any[]) => void;
}

export interface Container {
    add(item:any) : void;
    add(item:any, name : string) : void;
    get(constructor:Function) : any;
    get(name:string) : any;
    has(constructor:Function) : any;
    has(name:string) : any;
    init() : void;
    destroy() : void;
}

interface Injectable {
    __cntnr__injections : Array<(self : any, container : ContainerImpl) => void>;
    __cntnr__removeInjections : Array<(self : any) => void>;
    __cntnr__resolveDependencies : (self:any, container : Container) => void;
    __cntnr__destroys : Array<(self : any) => void>;
    __cntnr__resolveDestroy : (self : any) => void;
    __cntnr__postconstructs : Array<(self : any) => void>;
    __cntnr__resolvePostconstruct : (self : any) => void;
}

function initInjectable(obj : any) : Injectable {

    let injectable : Injectable = obj;

    if(!injectable.__cntnr__injections) {

        injectable.__cntnr__injections = [];
        injectable.__cntnr__removeInjections = [];
        injectable.__cntnr__resolveDependencies = (self:any, container : Container) => {
            injectable.__cntnr__injections.forEach((resolveFunc:Function) => resolveFunc(self, container));
        };

        injectable.__cntnr__destroys = [];
        injectable.__cntnr__resolveDestroy = (self:any) => {
            injectable.__cntnr__destroys.forEach((destroyFunc:Function) => destroyFunc(self));
        };

        injectable.__cntnr__postconstructs = [];
        injectable.__cntnr__resolvePostconstruct = (self:any) => {
            injectable.__cntnr__postconstructs.forEach((postConstructFunc:Function) => {
                postConstructFunc(self)
            });
        };
    }

    return injectable;
}




// ------------------
// CONTAINER
// ------------------

export class ContainerBuilder {
    static create() : Container {
        return new ContainerImpl();
    }
}

class ContainerImpl implements Container {

    private _deferredConstructors : Array<ConstructorDescriptor> = [];

    private _contentByCtor : Map<Function, any> = new Map();
    private _contentByName : Map<string, any> = new Map();

    private _isInitialised : Boolean = false;
    private _isDestroyed : Boolean = false;

    add(item:any, name?:string):void {

        if(this._isDestroyed) {
            throw 'cannot add elements to a destroyed context';
        }

        if(isFunction(item)) {
            this.addConstructor(item, name);
        } else {
            this.addElement(item, name);
        }
    }

    private addConstructor(ctor : any, name?:string) : void {
        let descriptor : ConstructorDescriptor = {
                name : name,
                params : ctor.prototype[CONSTRUCTOR_PARAMETERS_PROP],
                ctor : ctor
            };

        descriptor.params = descriptor.params || [];

        if(this._isInitialised) {
            this.resolveConstructor(descriptor);
        } else {
            this._deferredConstructors.push(descriptor);
        }
    }

    private addElement(element : any, name?:string) : void {
        if(name) {
            this._contentByName.set(name, element);
        } else {
            this._contentByCtor.set(element.constructor, element);
        }

        if(this._isInitialised) {
            this.resolveInjectionsFor(element);
        }
    }

    get(selector:any):any {
        if(typeof selector === "string" || selector instanceof String) {
            return this._contentByName.get(selector);
        }else {
            return this._contentByCtor.get(selector);
        }
    }

    has(selector:any) : boolean {
        let element = this.get(selector);
        return element != null && element != undefined;
    }

    init():void {
        if(this._isInitialised) {
            throw 'the container is already initialised'
        }

        //TODO: check circular injections to remove the need of adding constructors after instances in a given order

        this.resolveInjections();

        this._deferredConstructors.forEach(x => this.resolveConstructor(x));

        this.postConstruct();
        this._isInitialised = true;
    }


    private resolveConstructor(ctorDescriptor : ConstructorDescriptor) : void {

        if(ctorDescriptor.params) {
            ctorDescriptor.params.forEach(dependency => {
                if(!this.has(dependency)) {
                    throw new Error("couldn't find constructor parameter '" + dependency + "' for injection");
                }
            })
        }

        let args : Array<any>;

        if(ctorDescriptor.params) {
            args = ctorDescriptor.params.map(x => this.get(x));
        }  else {
            args = [];
        }

        let obj = createNew.apply(null,[ctorDescriptor.ctor].concat(args));

        if(ctorDescriptor.name) {
            this._contentByName.set(ctorDescriptor.name, obj);
        } else {
            this._contentByCtor.set(ctorDescriptor.ctor, obj);
        }
    }

    private resolveInjections():void {
        this.getAll().forEach((item:any) => this.resolveInjectionsFor(item));
    }

    private resolveInjectionsFor(item : any) : void {
        if (item.__cntnr__resolveDependencies) {
            item.__cntnr__resolveDependencies(item, this);
        }
    }

    postConstruct():void {
        let resolvePostConstruct = (item:any) => {
            if (item.__cntnr__resolvePostconstruct) {
                item.__cntnr__resolvePostconstruct(item);
            }
        };
        this.getAll().forEach((item:any) => resolvePostConstruct(item));
    }

    destroy() {
        if(this._isDestroyed) {
            throw 'the container is already destroyed'
        }
        if(!this._isInitialised) {
            throw "the container hasn't been initialised"
        }

        let resolveDestroy = (item : Injectable) => {
            if (item.__cntnr__resolveDestroy) {
                item.__cntnr__resolveDestroy(item);
            }
        };

        let removeInjections = (item : Injectable) => {
            if (item.__cntnr__removeInjections) {
                item.__cntnr__removeInjections.forEach(f => f(item))
            }
        };

        this.getAll().forEach((item:Injectable) => resolveDestroy(item));
        this.getAll().forEach((item:Injectable) => removeInjections(item));

        this._contentByCtor = new Map();
        this._contentByName = new Map();
        this._deferredConstructors = [];
        this._isDestroyed = true;
    }

    private getAll() : Array<any> {
        return Array.from(this._contentByCtor.values()).concat(Array.from(this._contentByName.values()))
    }
}





// ------------------
// DECORATORS
// ------------------

export const PostInject = PostConstruct; // alias, PostConstruct is deprecated

export function PostConstruct(target:any, propertyKey:string, descriptor:any) {
    let injectable : Injectable = initInjectable(target);

    injectable.__cntnr__postconstructs.push((self:any) => {
        self[propertyKey]()
    });
}

export function Destroy(target:any, propertyKey:string, descriptor:any) {
    let injectable : Injectable = initInjectable(target);

    injectable.__cntnr__destroys.push((self:any) => {
        self[propertyKey]()
    });
}

export function Inject(parameter?: (() => any) | string) {
    return function (target:any, propertyKey:any) {

        let injectable : Injectable = initInjectable(target);

        let resolveFunction = (self:any, container : ContainerImpl) => {
            let query : any;

            if(!parameter) {
                query = propertyKey;
            } else {
                query = (typeof parameter === "string" || parameter instanceof String) ? parameter : parameter();
            }
            let instance = container.get(query);

            if (instance == null || instance == undefined) {
                throw 'unable to resolve injection';
            }

            self[propertyKey] = instance;
        };

        injectable.__cntnr__injections.push(resolveFunction);
        injectable.__cntnr__removeInjections.push(function(self) { self[propertyKey] = null});
    }
}

export function InjectConstructor(...args: string[]) {
    return function(target:any) {
        let injectable : any = target.prototype;
        injectable[CONSTRUCTOR_PARAMETERS_PROP] = args;
    }
}
