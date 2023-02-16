/// <reference types="node" />
import { WriteStream } from "fs";
import { Tool, ToolOptions, ProgressCallback, ToolError } from "./tool.js";
export interface UbuntuBackupMetadata {
    codename: string;
    comment: string;
    dir: string;
    serialno: string | number;
    size: string | number;
    time: string;
    restorations?: {
        codename: string;
        serialno: string;
        time: string;
    }[];
}
export interface AdbConfig {
    /**   -a                       listen on all network interfaces, not just localhost */
    allInterfaces: boolean;
    /**   -d                       use USB device (error if multiple devices connected) */
    useUsb: boolean;
    /**   -e                       use TCP/IP device (error if multiple TCP/IP devices available) */
    useTcpIp: boolean;
    /**   -s SERIAL                use device with given serial (overrides $ANDROID_SERIAL) */
    serialno?: string;
    /**   -t ID                    use device with given transport id */
    transportId?: string;
    /**   -H                       name of adb server host [default=localhost] */
    host: string | "localhost";
    /**   -P                       port of adb server [default=5037] */
    port: string | number | 5037;
    /** transport-level protocol */
    protocol: "tcp" | "udp";
    /**   -L SOCKET                listen on given socket for adb server [default=tcp:localhost:5037] */
    socket: string | "tcp:localhost:5037";
    /**   --exit-on-write-error    exit if stdout is closed */
    exitOnWriteError: boolean;
}
export type AdbOptions = AdbConfig | ToolOptions | {};
export type DeviceState = "device" | "recovery" | "bootloader";
export type ActualDeviceState = DeviceState | "offline";
export type RebootState = DeviceState | "download" | "edl" | "sideload" | "sideload-auto-reboot";
export type WaitState = "any" | DeviceState | "rescue" | "sideload" | "disconnect";
export interface Device {
    serialno: string;
    mode: string;
    transport_id: string | number;
    model?: string;
    device?: string;
    product?: string;
}
export declare class AdbError extends ToolError {
    get message(): string;
}
/** Android Debug Bridge (ADB) module */
export declare class Adb extends Tool {
    config: AdbConfig;
    constructor(options?: AdbOptions);
    /** Kill all adb servers and start a new one to rule them all */
    startServer(
    /** new config options to apply */
    options?: AdbOptions, 
    /** applies the --one-device SERIAL|USB flag, server will only connect to one USB device, specified by a serial number or USB device address */
    serialOrUsbId?: string | number): Promise<void>;
    /** Kill all running servers */
    killServer(): Promise<void>;
    /** Specifically connect to a device (tcp) */
    connect(address: string): Promise<ActualDeviceState>;
    /** kick connection from host side to force reconnect */
    reconnect(modifier?: "device" | "offline"): Promise<ActualDeviceState>;
    /** kick connection from device side to force reconnect */
    reconnectDevice(): Promise<string>;
    /** reset offline/unauthorized devices to force reconnect */
    reconnectOffline(): Promise<string>;
    /** list devices */
    devices(): Promise<Device[]>;
    /** Get the devices serial number */
    getSerialno(): Promise<string>;
    /** run remote shell command and resolve stdout */
    shell(...args: (string | number)[]): Promise<string>;
    /** determine child_process.spawn() result */
    private onCpExit;
    /** extract chunk size from logging */
    private parseChunkSize;
    /** calculate progress from current/total */
    private normalizeProgress;
    private spawnFileTransfer;
    /** copy local files/directories to device */
    push(files: string[] | undefined, dest: string, progress?: ProgressCallback): Promise<void>;
    /** sideload an ota package */
    sideload(file: string, progress?: ProgressCallback): Promise<void>;
    /**
     * Reboot to a state
     * reboot the device; defaults to booting system image but
     * supports bootloader and recovery too. sideload reboots
     * into recovery and automatically starts sideload mode,
     * sideload-auto-reboot is the same but reboots after sideloading.
     */
    reboot(state?: RebootState): Promise<void>;
    /** Return the status of the device */
    getState(): Promise<ActualDeviceState>;
    /** Reboot to a requested state, if not already in it */
    ensureState(state: DeviceState): Promise<ActualDeviceState>;
    /** read property from getprop or, failing that, the default.prop file */
    getprop(prop: string): Promise<string>;
    /** get device codename from getprop or by reading the default.prop file */
    getDeviceName(): Promise<string>;
    /** resolves true if recovery is system-image capable, false otherwise */
    getSystemImageCapability(): Promise<boolean>;
    /** Find out what operating system the device is running (currently android and ubuntu touch) */
    getOs(): Promise<"ubuntutouch" | "android">;
    /** Find out if a device can be seen by adb */
    hasAccess(): Promise<boolean>;
    /** wait for a device, optionally limiting to specific states or transport types */
    wait(state?: WaitState, transport?: "any" | "usb" | "local"): Promise<ActualDeviceState>;
    /** Format partition */
    format(partition: string): Promise<void>;
    /** Format cache if possible and rm -rf its contents */
    wipeCache(): Promise<void>;
    /** Find the partition associated with a mountpoint in an fstab */
    private findPartitionInFstab;
    /** Find a partition and verify its type */
    verifyPartitionType(partition: string, type: string): Promise<boolean>;
    /** size of a file or directory */
    getFileSize(file: string): Promise<number>;
    /** available size of a partition */
    getAvailablePartitionSize(partition: string): Promise<number>;
    /** total size of a partition */
    getTotalPartitionSize(partition: string): Promise<number>;
    /** [EXPERIMENTAL] Run a command via adb exec-out and pipe the result to a stream, e.g., from fs.createWriteStream() */
    execOut(writableStream: WriteStream, ...args: (string | number | null | undefined)[]): Promise<void>;
    /** [EXPERIMENTAL] Backup "srcfile" from the device to local tar "destfile" */
    private createBackupTar;
    /** [EXPERIMENTAL] Restore tar "srcfile" */
    private restoreBackupTar;
    /** List backups */
    listUbuntuBackups(backupBaseDir: string): Promise<UbuntuBackupMetadata[]>;
    /** create a full backup of ubuntu touch */
    createUbuntuTouchBackup(backupBaseDir: string, comment?: string, dataPartition?: string, progress?: ProgressCallback): Promise<UbuntuBackupMetadata>;
    /** restore a full backup of ubuntu touch */
    restoreUbuntuTouchBackup(dir: string, progress?: ProgressCallback): Promise<UbuntuBackupMetadata>;
}
