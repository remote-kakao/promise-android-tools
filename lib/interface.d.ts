/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from "node:events";
import { HierarchicalAbortController } from "./hierarchicalAbortController.js";
/** HACK upstream definitions are incomplete */
export declare var AbortSignal: {
    prototype: AbortSignal;
    new (): AbortSignal;
    timeout(msecs: number): AbortSignal;
    abort(): AbortSignal;
};
export interface Interface extends EventEmitter, HierarchicalAbortController {
    on(eventName: "exec", listener: (e: {
        cmd: string[];
        error?: Error;
        stdout?: string;
        stderr?: string;
    }) => void): this;
    on(eventName: "spawn:start", listener: (e: {
        cmd: string[];
    }) => void): this;
    on(eventName: "spawn:exit", listener: (e: {
        cmd: string[];
        error?: Error;
    }) => void): this;
    on(eventName: "spawn:error", listener: (e: {
        cmd: string[];
        error: Error;
    }) => void): this;
}
export declare class Interface extends HierarchicalAbortController {
    this: Interface;
    /** returns clone listening to additional AbortSignals */
    _withSignals(...signals: AbortSignal[]): this;
    /** returns clone that will time out after the spelistening to an additional timeout abortSignal */
    _withTimeout(msecs?: number): this;
    /**
     * returns clone with variation in env vars
     * @virtual
     */
    protected _withEnv?(env: NodeJS.ProcessEnv): this;
    /**
     * Find out if a device can be seen
     * @virtual
     */
    protected hasAccess(): Promise<boolean>;
    /**
     * Wait for a device
     * @virtual
     */
    protected wait?(): Promise<string | any>;
    /**
     * Resolve device name
     * @virtual
     */
    protected getDeviceName?(): Promise<string>;
}
