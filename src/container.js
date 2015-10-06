///<reference path='./lib/immutable.d.ts'/>
var Immutable = require('immutable');
var ContainerBuilder = (function () {
    function ContainerBuilder() {
    }
    ContainerBuilder.create = function () {
        return new ContainerImpl();
    };
    return ContainerBuilder;
})();
exports.ContainerBuilder = ContainerBuilder;
var ContainerImpl = (function () {
    function ContainerImpl() {
        this._contentByCtor = Immutable.Map();
        this._contentByName = Immutable.Map();
        this._isInitialised = false;
        this._isDestroyed = false;
    }
    ContainerImpl.prototype.add = function (item, name) {
        if (this._isDestroyed) {
            throw 'cannot add elements to a destroyed context';
        }
        if (name) {
            this._contentByName = this._contentByName.set(name, item);
        }
        else {
            this._contentByCtor = this._contentByCtor.set(item.constructor, item);
        }
        if (this._isInitialised) {
            this.resolveInjectionsFor(item);
        }
    };
    ContainerImpl.prototype.get = function (selector) {
        if (typeof selector === "string" || selector instanceof String) {
            return this._contentByName.get(selector);
        }
        else {
            return this._contentByCtor.get(selector);
        }
    };
    ContainerImpl.prototype.init = function () {
        if (this._isInitialised) {
            throw 'the container is already initialised';
        }
        this.resolveInjections();
        this.postConstruct();
        this._isInitialised = true;
    };
    ContainerImpl.prototype.resolveInjections = function () {
        var _this = this;
        this.getAll().forEach(function (item) { return _this.resolveInjectionsFor(item); });
    };
    ContainerImpl.prototype.resolveInjectionsFor = function (item) {
        if (item.__resolveDependencies) {
            item.__resolveDependencies(item, this);
        }
    };
    ContainerImpl.prototype.postConstruct = function () {
        let resolvePostConstruct = function (item) {
            if (item.__resolvePostconstruct) {
                item.__resolvePostconstruct(item);
            }
        };
        this.getAll().forEach(function (item) { return resolvePostConstruct(item); });
    };
    ContainerImpl.prototype.destroy = function () {
        if (this._isDestroyed) {
            throw 'the container is already destroyed';
        }
        if (!this._isInitialised) {
            throw "the container hasn't been initialised";
        }
        let resolveDestroy = function (item) {
            if (item.__resolveDestroy) {
                item.__resolveDestroy(item);
            }
        };
        this.getAll().forEach(function (item) { return resolveDestroy(item); });
        this._contentByCtor = Immutable.Map();
        this._contentByName = Immutable.Map();
        this._isDestroyed = true;
    };
    ContainerImpl.prototype.getAll = function () {
        return this._contentByCtor.valueSeq().concat(this._contentByName.valueSeq());
    };
    return ContainerImpl;
})();
function PostConstruct(target, propertyKey, descriptor) {
    if (!target['__postconstructs']) {
        target.__postconstructs = [];
        target.__resolvePostconstruct = function (self) {
            target.__postconstructs.forEach(function (postConstructFunc) {
                postConstructFunc(self);
            });
        };
    }
    target.__postconstructs.push(function (self) {
        self[propertyKey]();
    });
    return descriptor;
}
exports.PostConstruct = PostConstruct;
function Destroy(target, propertyKey, descriptor) {
    if (!target['__destroys']) {
        target.__destroys = [];
        target.__resolveDestroy = function (self) {
            target.__destroys.forEach(function (destroyFunc) { return destroyFunc(self); });
        };
    }
    target.__destroys.push(function (self) {
        self[propertyKey]();
    });
    return descriptor;
}
exports.Destroy = Destroy;
function Inject(parameter) {
    return function (target, propertyKey) {
        if (!target['__injections']) {
            target.__injections = [];
            target.__resolveDependencies = function (self, container) {
                target.__injections.forEach(function (resolveFunc) { return resolveFunc(self, container); });
            };
        }
        let resolveFunction = function (self, container) {
            let query;
            if (!parameter) {
                query = propertyKey;
            }
            else {
                query = (typeof parameter === "string" || parameter instanceof String) ? parameter : parameter();
            }
            let instance = container.get(query);
            if (instance == null || instance == undefined) {
                throw 'unable to resolve injection';
            }
            self[propertyKey] = instance;
        };
        target.__injections.push(resolveFunction);
    };
}
exports.Inject = Inject;
//# sourceMappingURL=container.js.map