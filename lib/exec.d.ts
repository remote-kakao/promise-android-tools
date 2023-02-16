/// <reference types="node" />
import { execFile } from "node:child_process";
export declare const exec: typeof execFile.__promisify__;
export { spawn, ChildProcess, ExecException } from "node:child_process";
