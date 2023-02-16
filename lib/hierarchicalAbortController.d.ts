export declare class HierarchicalAbortController extends AbortController {
    constructor(
    /** abort signals to listen to */
    ...signals: AbortSignal[]);
    listen(
    /** abort signals to listen to */
    ...signals: AbortSignal[]): void;
}
