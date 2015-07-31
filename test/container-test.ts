///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/container.ts"/>

import {ContainerBuilder, Container, Inject, PostConstruct, Destroy} from '../src/container';
import {expect} from 'chai';

class TestClass  {
    
    @Inject(() => {return TestDependency1})
    dep1 : TestDependency1;
    
    @Inject('dependency')
    dep2 : TestDependency2;
    
    initialised : boolean = false;
    destroyed : boolean = false;
    
    @PostConstruct
    private init() : void {
        this.initialised = true;
    }
    
    @Destroy
    destroy() : void {
        this.destroyed = true;
    }
}

class TestDependency1  {
    label : string = 'hi';
}

class TestDependency2  {
    label : string = 'hiya';
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

    it('can have elements added and retrieved from the container',() => {
        let element = new TestDependency1();
        container.add(element);
        expect(container.get(TestDependency1)).equals(element);
    });
    
    it('retrieving an element that wasnt registered returns undefined',() => {
        expect(container.get(TestDependency1)).to.be.undefined
    });

    it('dependencies are resolved',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');

        container.init();

        expect(testObject.dep1).not.to.be.undefined;
        expect(testObject.dep2).not.to.be.undefined;
        expect(testObject.dep1).not.to.be.null;
        expect(testObject.dep2).not.to.be.null;

        expect(testObject.dep1.label).equals('hi');
        expect(testObject.dep2.label).equals('hiya');
    });

    it('should invoke postconstruct methods',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');

        container.init();

        expect(testObject.initialised).to.be.true
    });

    it('should invoke destroy methods',() => {
        let testObject = new TestClass();
        container.add(testObject);

        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');

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
        container.init();

        let container2 = ContainerBuilder.create();
        let testObject2 = new TestClass();
        container2.add(testObject2);
        container2.add(new TestDependency1());
        container2.add(new TestDependency2(), 'dependency');
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

    it('should resolve injections for dynamically added elements',() => {
        container.add(new TestClass());
        container.add(new TestDependency1());
        container.add(new TestDependency2(), 'dependency');
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

});



