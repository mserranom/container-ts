/// <reference path="lib/immutable.d.ts" />
export interface Container {
    add(item: any): void;
    add(item: any, name: string): void;
    get(clazz: Function): any;
    get(name: string): any;
    init(): void;
    destroy(): void;
}
export declare class ContainerBuilder {
    static create(): Container;
}
export declare function PostConstruct(target: any, propertyKey: string, descriptor: any): any;
export declare function Destroy(target: any, propertyKey: string, descriptor: any): any;
export declare function Inject(parameter?: (() => any) | string): (target: any, propertyKey: any) => void;
