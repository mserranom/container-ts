# container-ts
Lightweight annotation-based dependency injection container for typescript.

[![Build Status](https://travis-ci.org/mserranom/container-ts.png?branch=master)](https://travis-ci.org/mserranom/container-ts)

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
@Destroy(
@Inject
```
