import { ProgressCallback, Tool, ToolError, ToolOptions } from "./tool.js";
export interface FastbootFlashImage {
    /** partition to flash */
    partition: string;
    /** path to an image file */
    file: string;
    /** use `fastboot flash:raw` instead of `fastboot flash` */
    raw?: boolean;
    /** additional cli-flags like --force and --disable-verification */
    flags?: string[];
}
export interface FastbootConfig {
    wipe: boolean;
    device?: string | number;
    maxSize?: string;
    force: boolean;
    slot?: "all" | "current" | "other";
    setActive?: "all" | "current" | "other";
    skipSecondary: boolean;
    skipReboot: boolean;
    disableVerity: boolean;
    disableVerification: boolean;
    fsOptions?: string;
    unbuffered: boolean;
}
export type FastbootOptions = ToolOptions | FastbootConfig | {};
export declare class FastbootError extends ToolError {
    get message(): string;
}
/** fastboot android flashing and booting utility */
export declare class Fastboot extends Tool {
    config: FastbootConfig;
    constructor(options?: FastbootOptions);
    /** Write a file to a flash partition */
    flash(images: FastbootFlashImage[], progress?: ProgressCallback): Promise<void>;
    /** Download and boot kernel */
    boot(image: string): Promise<void>;
    /** Reflash device from update.zip and set the flashed slot as active */
    update(image: string, wipe?: string | boolean): Promise<void>;
    /** Reboot device into bootloader */
    rebootBootloader(): Promise<void>;
    /**
     * Reboot device into userspace fastboot (fastbootd) mode
     * Note: this only works on devices that support dynamic partitions.
     */
    rebootFastboot(): Promise<void>;
    /** Reboot device into recovery */
    rebootRecovery(): Promise<void>;
    /** Reboot device */
    reboot(): Promise<void>;
    /** Continue with autoboot */
    continue(): Promise<void>;
    /** Format a flash partition. Can override the fs type and/or size the bootloader reports */
    format(partition: string, type?: string, size?: string | number): Promise<void>;
    /** Erase a flash partition */
    erase(partition: string): Promise<void>;
    /** Sets the active slot */
    setActive(slot: string): Promise<void>;
    /** Create a logical partition with the given name and size, in the super partition */
    createLogicalPartition(partition: string, size: string | number): Promise<void>;
    /** Resize a logical partition with the given name and final size, in the super partition */
    resizeLogicalPartition(partition: string, size: string | number): Promise<void>;
    /** Delete a logical partition with the given name */
    deleteLogicalPartition(partition: string): Promise<void>;
    /** Wipe the super partition and reset the partition layout */
    wipeSuper(image: string): Promise<void>;
    /** Lift OEM lock */
    oemUnlock(
    /** optional unlock code (including 0x if necessary) */
    code?: string | number): Promise<void>;
    /** Enforce OEM lock */
    oemLock(): Promise<void>;
    /** unlock partitions for flashing */
    flashingUnlock(): Promise<void>;
    /** lock partitions for flashing */
    flashingLock(): Promise<void>;
    /** unlock 'critical' bootloader partitions */
    flashingUnlockCritical(): Promise<void>;
    /** lock 'critical' bootloader partitions */
    flashingLockCritical(): Promise<void>;
    /** Find out if a device can be flashing-unlocked */
    getUnlockAbility(): Promise<boolean>;
    /** Find out if a device can be seen by fastboot */
    hasAccess(): Promise<boolean>;
    /** wait for a device */
    wait(): Promise<"bootloader">;
    /** get bootloader var */
    getvar(variable: string): Promise<string>;
    /** get device codename from product bootloader var */
    getDeviceName(): Promise<string>;
}
