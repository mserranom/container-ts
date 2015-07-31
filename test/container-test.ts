///<reference path="../typings/tsd.d.ts"/>
///<reference path="../src/container.ts"/>

import {IInjector, Injector, Inject, PostConstruct, Destroy} from '../src/container';
import {expect} from 'chai';

class TestApp {   
    @Injector injector : IInjector;
}

class TestClass  {
    
    @Inject(() => {return TestDependency1})
    dep1 : TestDependency1;
    
    @Inject(() => {return TestDependency2})
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

describe('IoC: ', () => {

    let app = new TestApp();
    let container = app.injector;
    
    afterEach(() => {
       container.destroy();
    });

    it('elements can be added and retrieved from the container',() => {
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
        container.add(new TestDependency2());
        
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
        container.add(new TestDependency2());
        
        container.init();
        
        expect(testObject.initialised).to.be.true
    });
    
    it('should invoke destroy methods',() => {
        let testObject = new TestClass();
        container.add(testObject);
        
        container.add(new TestDependency1());
        container.add(new TestDependency2());
        
        container.init();
        container.destroy();
        
        expect(testObject.destroyed).to.be.true;
    });
    
    it('should throw an error when an injection cannot be resolved',() => {
        container.add(new TestClass());
        expect(() => container.init()).to.throw('unable to resolve injection');
    });
    
});



