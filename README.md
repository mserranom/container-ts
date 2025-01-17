# container-ts
Lightweight decorator-based Dependency Injection container for Typescript and ES7.

[![npm version](https://badge.fury.io/js/container-ts.svg)](https://badge.fury.io/js/container-ts)

## ⚠️ Status 

This project is no longer maintained.

## Features
 * Dependency Injection via ES6 Decorators
 * Container lifecycle management

## API
```typescript
Container {
    add(item: any): void;
    add(item: any, name: string): void;
    get(ctor: Function): any;
    get(name: string): any;
    has(ctor: Function): any;
    has(name: string): any;
    init(): void;
    destroy(): void;
}

class ContainerBuilder {
    static create(): Container;
}

// decorators
@Inject(selector: () => any | string)
@Destroy
@PostConstruct
```

## Usage
```typescript
import {ContainerBuilder, Container, Inject, PostConstruct, Destroy} from './container';

@InjectConstructor('ctorDependency1', 'ctorDependency2')
MainClass {

    @Inject('elementId')  // injection by id
    dependency1 : DependencyClass1;

    @Inject(() => DependencyClass2)  // injection by type
    dependency2 : DependencyClass2;

    constructor(a : CtorDependency1, b : CtorDependency2) {
        // ...
    }

    @PostConstruct // invoked after all injections have been resolved
    init() {
        console.log(dependency1.sayHello());
    }

    @Destroy
    destroy() {
        console.log('destroy');
    }
}

let container = ContainerBuilder.create();

container.add(new MainClass());
container.add(new DependencyClass1(), 'elementId');
container.add(new DependencyClass2());

container.add(new CtorDependency1(), 'ctorDependency1');
container.add(new CtorDependency2(), 'ctorDependency2');

container.get('elementId'); // returns the instance of DependencyClass1 added as 'elementId'

container.get(DependencyClass2); // returns the DependencyClass2 instance

container.init();  // output: "Hello!

container.destroy(); // output: "destroy"
```

## Building

```
npm install && npm test
```
