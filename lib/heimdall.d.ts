import { Tool, ToolError, ToolOptions } from "./tool.js";
export type HeimdallOptions = ToolOptions | {};
export interface HeimdallConfig {
}
export declare class HeimdallError extends ToolError {
    get message(): string;
}
/** heimdall: flash firmware on samsung devices */
export declare class Heimdall extends Tool {
    config: HeimdallConfig;
    constructor(options?: HeimdallOptions);
    /** Find out if a device in download mode can be seen by heimdall */
    detect(): Promise<boolean>;
    /** Find out if a device in download mode can be seen by heimdall */
    hasAccess(): Promise<boolean>;
    /** Wait for a device */
    wait(): Promise<"download">;
    /** Prints the contents of a PIT file in a human readable format. If a filename is not provided then Heimdall retrieves the PIT file from the connected device. */
    printPit(file?: string): Promise<string[]>;
    /** get partitions from pit file */
    getPartitions(): Promise<{}[]>;
    /** Flash firmware files to partitions (names or identifiers) */
    flash(images: {
        partition: string;
        file: string;
    }[]): Promise<void>;
}
