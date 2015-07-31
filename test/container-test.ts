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
    init() : void {
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

describe('container: ', () => {

    let container : Container = ContainerBuilder.create();
    
    afterEach(() => {
       container.destroy();
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
    
});



