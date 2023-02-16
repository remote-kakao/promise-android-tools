/// <reference types="node" />
import { ActualDeviceState, Adb, AdbOptions } from "./adb.js";
import { Fastboot, FastbootOptions } from "./fastboot.js";
import { Heimdall, HeimdallOptions } from "./heimdall.js";
import { Interface } from "./interface.js";
export interface DeviceToolsOptions {
    adbOptions?: AdbOptions;
    fastbootOptions?: FastbootOptions;
    heimdallOptions?: HeimdallOptions;
    signals?: AbortSignal[];
}
/** A wrapper for Adb, Fastboot, and Heimall that returns convenient promises. */
export declare class DeviceTools extends Interface {
    adb: Adb;
    fastboot: Fastboot;
    heimdall: Heimdall;
    constructor({ adbOptions, fastbootOptions, heimdallOptions, signals }: DeviceToolsOptions);
    /** returns clone with variation in env vars */
    _withEnv(env: NodeJS.ProcessEnv): this;
    /** Wait for a device */
    wait(): Promise<ActualDeviceState | "bootloader" | "download">;
    /** Resolve device name */
    getDeviceName(): Promise<string>;
}
export * from "./adb.js";
export * from "./fastboot.js";
export * from "./heimdall.js";
export * from "./tool.js";
export * from "./interface.js";
export * from "./hierarchicalAbortController.js";
