///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/container.ts"/>
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") return Reflect.decorate(decorators, target, key, desc);
    switch (arguments.length) {
        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);
        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);
        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);
    }
};
var container_1 = require('../src/container');
var chai_1 = require('chai');
var TestClass = (function () {
    function TestClass() {
        this.initialised = false;
        this.destroyed = false;
    }
    TestClass.prototype.init = function () {
        this.initialised = true;
    };
    TestClass.prototype.destroy = function () {
        this.destroyed = true;
    };
    __decorate([
        container_1.Inject(function () { return TestDependency1; })
    ], TestClass.prototype, "dep1");
    __decorate([
        container_1.Inject('dependency')
    ], TestClass.prototype, "dep2");
    __decorate([
        container_1.Inject()
    ], TestClass.prototype, "testDependency3");
    Object.defineProperty(TestClass.prototype, "init",
        __decorate([
            container_1.PostConstruct
        ], TestClass.prototype, "init", Object.getOwnPropertyDescriptor(TestClass.prototype, "init")));
    Object.defineProperty(TestClass.prototype, "destroy",
        __decorate([
            container_1.Destroy
        ], TestClass.prototype, "destroy", Object.getOwnPropertyDescriptor(TestClass.prototype, "destroy")));
    return TestClass;
})();
var TestDependency1 = (function () {
    function TestDependency1() {
        this.label = 'hi';
    }
    return TestDependency1;
})();
var TestDependency2 = (function () {
    function TestDependency2() {
        this.label = 'hiya';
    }
    return TestDependency2;
})();
var TestDependency3 = (function () {
    function TestDependency3() {
        this.label = 'hiya!!';
    }
    return TestDependency3;
})();
describe('Container: ', function () {
    var container;
    beforeEach(function () {
        container = container_1.ContainerBuilder.create();
    });
    afterEach(function () {
        try {
            container.destroy();
        }
        catch (error) { }
    });
    it('can have elements added and retrieved from the container', function () {
        var element = new TestDependency1();
        container.add(element);
        chai_1.expect(container.get(TestDependency1)).equals(element);
    });
    it('retrieving an element that wasnt registered returns undefined', function () {
        chai_1.expect(container.get(TestDependency1)).to.be.undefined;
    });
    it('dependencies are resolved', function () {
        var testObject = new TestClass();
        container.add(testObject);
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();
        chai_1.expect(testObject.dep1).not.to.be.undefined;
        chai_1.expect(testObject.dep2).not.to.be.undefined;
        chai_1.expect(testObject.testDependency3).not.to.be.undefined;
        chai_1.expect(testObject.dep1).not.to.be.null;
        chai_1.expect(testObject.dep2).not.to.be.null;
        chai_1.expect(testObject.testDependency3).not.to.be.null;
        chai_1.expect(testObject.dep1.label).equals('hi');
        chai_1.expect(testObject.dep2.label).equals('hiya');
        chai_1.expect(testObject.testDependency3.label).equals('hiya!!');
    });
    it('should invoke postconstruct methods', function () {
        var testObject = new TestClass();
        container.add(testObject);
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();
        chai_1.expect(testObject.initialised).to.be.true;
    });
    it('should invoke destroy methods', function () {
        var testObject = new TestClass();
        container.add(testObject);
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();
        container.destroy();
        chai_1.expect(testObject.destroyed).to.be.true;
    });
    it('should throw an error when an injection cannot be resolved', function () {
        container.add(new TestClass());
        chai_1.expect(function () { return container.init(); }).to.throw('unable to resolve injection');
    });
    it('should be possible to have separate containers', function () {
        var testObject = new TestClass();
        container.add(testObject);
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();
        var container2 = container_1.ContainerBuilder.create();
        var testObject2 = new TestClass();
        container2.add(testObject2);
        container2.add(new TestDependency1());
        container2.add(new TestDependency2(), 'dependency');
        container2.add(new TestDependency3(), 'testDependency3');
        container2.init();
        testObject.dep1.label = 'other label';
        chai_1.expect(testObject2.dep1.label).equals('hi');
    });
    it('should throw an error when trying to initialise the context twice', function () {
        container.init();
        chai_1.expect(function () { return container.init(); }).to.throw('the container is already initialised');
    });
    it('should throw an error when trying to destroy a context not initialised', function () {
        chai_1.expect(function () { return container.destroy(); }).to.throw("the container hasn't been initialised");
    });
    it('should throw an error when trying to destroy a context twice', function () {
        container.init();
        container.destroy();
        chai_1.expect(function () { return container.destroy(); }).to.throw('the container is already destroyed');
    });
    it('should throw an error when adding elements to a destroyed context', function () {
        container.init();
        container.destroy();
        chai_1.expect(function () { return container.add(new TestClass()); }).to.throw('cannot add elements to a destroyed context');
    });
    it('should resolve injections for dynamically added elements', function () {
        container.add(new TestClass());
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();
        var testObject = new TestClass();
        container.add(testObject, 'secondTestClass');
        chai_1.expect(testObject.dep1.label).equals('hi');
        chai_1.expect(testObject.dep2.label).equals('hiya');
    });
    it('should allow multiple named elements of same type', function () {
        container.add(new TestClass());
        container.add(new TestClass(), 'element1');
        container.add(new TestClass(), 'element2');
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();
        var element = container.get(TestClass);
        var element1 = container.get('element1');
        var element2 = container.get('element2');
        chai_1.expect(element).not.to.be.undefined;
        chai_1.expect(element1).not.to.be.undefined;
        chai_1.expect(element2).not.to.be.undefined;
        chai_1.expect(element).not.to.be.null;
        chai_1.expect(element1).not.to.be.null;
        chai_1.expect(element2).not.to.be.null;
        chai_1.expect(element).not.equals(element1);
        chai_1.expect(element).not.equals(element2);
        chai_1.expect(element1).not.equals(element2);
        chai_1.expect(element.dep1).not.to.be.undefined;
        chai_1.expect(element.dep2).not.to.be.undefined;
        chai_1.expect(element.dep1).not.to.be.null;
        chai_1.expect(element.dep2).not.to.be.null;
        chai_1.expect(element.dep1).equals(element1.dep1);
        chai_1.expect(element.dep1).equals(element2.dep1);
        chai_1.expect(element1.dep1).equals(element2.dep1);
        chai_1.expect(element.dep2).equals(element1.dep2);
        chai_1.expect(element.dep2).equals(element2.dep2);
        chai_1.expect(element1.dep2).equals(element2.dep2);
    });
});
//# sourceMappingURL=container-test.js.map