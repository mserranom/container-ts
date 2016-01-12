///<reference path='./lib/immutable.d.ts'/>
import Immutable = require('immutable');


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

    private _isInitialised : Boolean = false;
    private _isDestroyed : Boolean = false;

    add(item:any, name?:string):void {
        if(this._isDestroyed) {
            throw 'cannot add elements to a destroyed context';
        }
        if(name) {
            this._contentByName = this._contentByName.set(name, item);
        }
        else {
            this._contentByCtor = this._contentByCtor.set(item.constructor, item);
        }
        if(this._isInitialised) {
            this.resolveInjectionsFor(item);
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
        if(this._isInitialised) {
            throw 'the container is already initialised'
        }
        this.resolveInjections();
        this.postConstruct();
        this._isInitialised = true;
    }

    resolveInjections():void {
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

        this._contentByCtor = Immutable.Map<Function, any>();
        this._contentByName = Immutable.Map<string, any>();
        this._isDestroyed = true;
    }

    private getAll() : Immutable.Iterable<any, any> {
        return this._contentByCtor.valueSeq().concat(this._contentByName.valueSeq());
    }
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


export function PostConstruct(target:any, propertyKey:string, descriptor:any) {
    let injectable : Injectable = target;
    if (!injectable['__cntnr__postconstructs']) {
        injectable.__cntnr__postconstructs = [];
        injectable.__cntnr__resolvePostconstruct = (self:any) => {
            injectable.__cntnr__postconstructs.forEach((postConstructFunc:Function) => {
                postConstructFunc(self)
            });
        };
    }
    injectable.__cntnr__postconstructs.push((self:any) => {
        self[propertyKey]()
    });
    return descriptor;
}

export function Destroy(target:any, propertyKey:string, descriptor:any) {
    let injectable : Injectable = target;
    if (!injectable.__cntnr__destroys) {
        injectable.__cntnr__destroys = [];
        injectable.__cntnr__resolveDestroy = (self:any) => {
            injectable.__cntnr__destroys.forEach((destroyFunc:Function) => destroyFunc(self));
        };
    }
    injectable.__cntnr__destroys.push((self:any) => {
        self[propertyKey]()
    });
    return descriptor;
}

export function Inject(parameter?: (() => any) | string) {
    return function (target:any, propertyKey:any) {
        let injectable : Injectable = target;
        if (!injectable.__cntnr__injections) {
            injectable.__cntnr__injections = [];
            injectable.__cntnr__removeInjections = [];
            injectable.__cntnr__resolveDependencies = (self:any, container : Container) => {
                injectable.__cntnr__injections.forEach((resolveFunc:Function) => resolveFunc(self, container));
            };
        }

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
