/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { ChildProcess, ExecException } from "./exec.js";
import { Readable, Writable } from "node:stream";
import { Interface } from "./interface.js";
export type Mutable<T> = {
    -readonly [P in keyof T]: T[P];
};
export type ProgressCallback = (percentage: number) => void;
/** executable in PATH or path to an executable */
export type ToolString = "adb" | "fastboot" | "heimdall" | string;
export interface ToolOptions {
    tool: ToolString;
    /** error class */
    Error: typeof ToolError;
    /** extra cli args */
    extraArgs?: string[];
    /** extra environment variables */
    extraEnv?: NodeJS.ProcessEnv;
    /** set PATH environment variable */
    setPath?: boolean;
    /** tool configuration */
    config?: ToolConfig;
    /** object describing arguments */
    argsModel?: ArgsModel;
    /** signals to listen to */
    signals?: AbortSignal[];
    /** additional properties */
    [propName: string]: any;
}
/** tool configuration */
export interface ToolConfig {
    [propName: string]: any;
}
export type Arg = [string, any?, any?, string?];
/** object describing arguments */
export interface ArgsModel {
    [propName: string]: Arg;
}
export type RawError = Partial<ExecException & Mutable<DOMException | Error>>;
export type ToolErrorMessage = "aborted" | "no device" | "more than one device" | "unauthorized" | "device offline" | "bootloader locked" | "enable unlocking" | "low battery" | "failed to boot";
export interface ToolError extends Error, Partial<DOMException> {
}
export declare class ToolError extends Error implements ExecException, ToolError {
    get message(): ToolErrorMessage | string;
    get name(): string;
    cause?: RawError;
    stdout?: string;
    stderr?: string;
    get cmd(): string | undefined;
    get killed(): boolean;
    constructor(
    /** error returned by exec() */
    error?: RawError, 
    /** standard output */
    stdout?: string, 
    /** standard error */
    stderr?: string);
}
/**
 * generic tool class
 */
export declare abstract class Tool extends Interface {
    #private;
    /** bundled tool, executable in PATH, or path to an executable */
    tool: ToolString;
    /** path to a bundled executable if it has been resolved in bundle */
    executable: ToolString | string;
    /** error class */
    Error: typeof ToolError;
    /** extra cli args */
    extraArgs: string[];
    /** extra environment variables */
    extraEnv: NodeJS.ProcessEnv;
    /** tool configuration */
    abstract config: ToolConfig;
    /** object describing arguments */
    protected argsModel: ArgsModel;
    /** environment variables */
    get env(): NodeJS.ProcessEnv;
    /** cli arguments */
    get args(): string[];
    constructor({ tool, Error, signals, extraArgs, extraEnv, setPath, config, argsModel, ...options }: ToolOptions);
    /** return a clone with a specified variation in the config options */
    _withConfig(config: any): this;
    /** returns clone with variation in env vars */
    _withEnv(env: NodeJS.ProcessEnv): this;
    /** helper functions */
    [key: `__${keyof typeof this.argsModel}`]: (val?: any) => this;
    /** apply config options to the tool instance */
    applyConfig(config: any): void;
    /** filter nullish and empty-string arguments */
    constructArgs(args: any[]): string[];
    /** Execute a command. Used for quick operations that do not require real-time data access. Output is trimmed. */
    exec(...args: (string | number | null | undefined)[]): Promise<string>;
    /** Spawn a child process. Used for long-running operations that require real-time data access. */
    spawn(...args: (string | number | null | undefined)[]): ChildProcess & {
        stdin: Writable;
        stdout: Readable;
        stderr: Readable;
    };
    /** Parse and simplify errors */
    protected error(error: RawError, stdout?: string, stderr?: string): RawError;
    /** Wait for a device */
    wait(): Promise<string | any>;
}
