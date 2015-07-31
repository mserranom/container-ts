# container-ts
Lightweight annotation-based dependency injection container for typescript.

[![Build Status](https://travis-ci.org/mserranom/container-ts.png?branch=master)](https://travis-ci.org/mserranom/container-ts)

## Features
 * Dependency Injection via ES6 Decorators
 * Container lifecycle management

## API
```typescript
Container {
    add(item: any): void;
    add(item: any, name: string): void;
    get(clazz: Function): any;
    get(name: string): any;
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

MainClass {

    @Inject('elementId')  // injection by id
    dependency1 : DependencyClass1;


    @Inject(() => {return DependencyClass2})  // injection by type
    dependency2 : DependencyClass2;

    @PostConstruct // invoked after all injections have been resolved
    init() {
        console.log(dependency1.sayHello());
    }

    @Destroy
    destroy() {
        console.log('destroy'); // output: "Hello!"
    }
}

let container = ContainerBuilder.create();

container.add(new MainClass());
container.add(new DependencyClass1());
container.add(new DependencyClass2());

container.init();  // output: "Hello!

container.destroy(); // output: "destroy"
```