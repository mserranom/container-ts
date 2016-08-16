///<reference path="../src/container.ts"/>
///<reference path="./../typings/chai.d.ts"/>

"use strict";

import {ContainerBuilder, Container, Inject, PostInject, Destroy, InjectConstructor} from '../src/container';

const expect = require('chai').expect;

class TestClass  {

    @Inject(() => TestDependency1)
    dep1 : TestDependency1;

    @Inject('dependency')
    dep2 : TestDependency2;

    @Inject()
    testDependency3 : TestDependency3;

    initialised : boolean = false;
    destroyed : boolean = false;

    @PostInject
    private init() : void {
        this.initialised = true;
    }

    @Destroy
    destroy() : void {
        if(!this.dep1 || !this.dep2 || !this.testDependency3) {
            throw new Error('injected elements have been nullified before destroying');
        }
        this.destroyed = true;
    }
}

class TestDependency1  {
    label : string = 'hi';
}

class TestDependency2  {
    label : string = 'hiya';
}

class TestDependency3  {
    label : string = 'hiya!!';
}

@InjectConstructor('testDependency1', 'testDependency2')
class ConstructorInjected  {

    private dep1 : TestDependency1;
    private dep2 : TestDependency2;

    constructor(param1 : TestDependency1, param2 : TestDependency2) {
        this.dep1 = param1;
        this.dep2 = param2;
    }

    sayHi1() : string {
        return this.dep1.label;
    }

    sayHi2() : string {
        return this.dep2.label;
    }
}

describe('Container: ', () => {

    let container : Container;

    beforeEach(() => {
        container = ContainerBuilder.create();
    });

    afterEach(() => {
        try {
            container.destroy();
        } catch(error) {}
    });

    it('can have elements added by instance and retrieved from the container by constructor',() => {
        let element = new TestDependency1();
        container.add(element);
        container.init();
        expect(container.get(TestDependency1)).equals(element);
    });

    it('can have elements added by constructor and retrieved from the container by constructor',() => {
        container.add(TestDependency1);
        container.init();
        expect(container.get(TestDependency1)).deep.equal(new TestDependency1());
    });


    it('retrieving an element that wasnt registered returns undefined',() => {
        expect(container.get(TestDependency1)).to.be.undefined
    });

    it('elements can be retrieved when the container is not yet initialised',() => {
        let element = new TestClass();
        container.add(element);
        expect(container.get(TestClass)).equals(element);
    });

    it('dependencies are resolved',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');

        container.init();

        expect(testObject.dep1).not.to.be.undefined;
        expect(testObject.dep2).not.to.be.undefined;
        expect(testObject.testDependency3).not.to.be.undefined;
        expect(testObject.dep1).not.to.be.null;
        expect(testObject.dep2).not.to.be.null;
        expect(testObject.testDependency3).not.to.be.null;

        expect(testObject.dep1.label).equals('hi');
        expect(testObject.dep2.label).equals('hiya');
        expect(testObject.testDependency3.label).equals('hiya!!');
    });

    it('should invoke postconstruct methods',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');

        container.init();

        expect(testObject.initialised).to.be.true
    });

    it('should invoke destroy methods',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');

        container.init();
        container.destroy();

        expect(testObject.destroyed).to.be.true;
    });

    it('should throw an error when an injection cannot be resolved',() => {
        container.add(new TestClass());
        expect(() => container.init()).to.throw('unable to resolve injection');
    });

    it('should be possible to have separate containers',() => {
        let testObject = new TestClass();
        container.add(testObject);
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();

        let container2 = ContainerBuilder.create();
        let testObject2 = new TestClass();
        container2.add(testObject2);
        container2.add(new TestDependency1());
        container2.add(new TestDependency2(), 'dependency');
        container2.add(new TestDependency3(), 'testDependency3');
        container2.init();

        testObject.dep1.label = 'other label';

        expect(testObject2.dep1.label).equals('hi');
    });

    it('should throw an error when trying to initialise the context twice',() => {
        container.init();
        expect(() => container.init()).to.throw('the container is already initialised');
    });

    it('should throw an error when trying to destroy a context not initialised',() => {
        expect(() => container.destroy()).to.throw("the container hasn't been initialised");
    });

    it('should throw an error when trying to destroy a context twice',() => {
        container.init();
        container.destroy();
        expect(() => container.destroy()).to.throw('the container is already destroyed');
    });

    it('should throw an error when adding elements to a destroyed context',() => {
        container.init();
        container.destroy();
        expect(() => container.add(new TestClass())).to.throw('cannot add elements to a destroyed context');
    });

    it('should nullify injected dependencies after destroying the context',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');

        container.init();
        container.destroy();

        expect(testObject.dep1).to.be.null;
        expect(testObject.dep2).to.be.null;
        expect(testObject.testDependency3).to.be.null;
    });

    it('should resolve injections for dynamically added elements',() => {
        container.add(new TestClass());
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();

        let testObject = new TestClass();
        container.add(testObject, 'secondTestClass');

        expect(testObject.dep1.label).equals('hi');
        expect(testObject.dep2.label).equals('hiya');
    });

    it('should allow multiple named elements of same type', () => {
        container.add(new TestClass());
        container.add(new TestClass(), 'element1');
        container.add(new TestClass(), 'element2');
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
        container.add(new TestDependency3(), 'testDependency3');
        container.init();

        let element = container.get(TestClass);
        let element1 = container.get('element1');
        let element2 = container.get('element2');

        // making sure the elements exists and are all different
        expect(element).not.to.be.undefined
        expect(element1).not.to.be.undefined
        expect(element2).not.to.be.undefined
        expect(element).not.to.be.null
        expect(element1).not.to.be.null
        expect(element2).not.to.be.null

        expect(element).not.equals(element1);
        expect(element).not.equals(element2);
        expect(element1).not.equals(element2);

        // making sure they're resolved to the same dependencies
        expect(element.dep1).not.to.be.undefined;
        expect(element.dep2).not.to.be.undefined;
        expect(element.dep1).not.to.be.null;
        expect(element.dep2).not.to.be.null;

        expect(element.dep1).equals(element1.dep1);
        expect(element.dep1).equals(element2.dep1);
        expect(element1.dep1).equals(element2.dep1);

        expect(element.dep2).equals(element1.dep2);
        expect(element.dep2).equals(element2.dep2);
        expect(element1.dep2).equals(element2.dep2);

    });


    describe('Constructor Injection:', () => {

        it('dependencies should be resolved in constructor injection, adding the constructor as nameless',() => {
            container.add(ConstructorInjected);
            container.add(new TestDependency2(), 'testDependency2');
            container.add(new TestDependency1(), 'testDependency1');
            container.init();

            let ctorInjected : ConstructorInjected = container.get(ConstructorInjected);

            expect(ctorInjected).not.to.be.null;
            expect(ctorInjected.sayHi1()).equals('hi');
            expect(ctorInjected.sayHi2()).equals('hiya');
        });

        it('dependencies should be resolved in constructor injection, giving the constructor a name',() => {
            container.add(ConstructorInjected, 'ctorInjected');
            container.add(new TestDependency2(), 'testDependency2');
            container.add(new TestDependency1(), 'testDependency1');
            container.init();

            let ctorInjected : ConstructorInjected = container.get('ctorInjected');

            expect(ctorInjected).not.to.be.null;
            expect(ctorInjected.sayHi1()).equals('hi');
            expect(ctorInjected.sayHi2()).equals('hiya');
        });

        it('adding constructor injected elements after the container is created should resolve injections',() => {

            container.add(new TestDependency2(), 'testDependency2');
            container.add(new TestDependency1(), 'testDependency1');
            container.init();

            container.add(ConstructorInjected, 'ctorInjected');

            let ctorInjected : ConstructorInjected = container.get('ctorInjected');

            expect(ctorInjected).not.to.be.null;
            expect(ctorInjected.sayHi1()).equals('hi');
            expect(ctorInjected.sayHi2()).equals('hiya');
        });

        it('should throw an error when a parameter cannot be found',() => {

            container.add(new TestDependency1(), 'testDependency1');
            container.add(ConstructorInjected, 'ctorInjected');

            expect(() => container.init()).to.throw("couldn't find constructor parameter 'testDependency2' for injection");
        });

    });

});



