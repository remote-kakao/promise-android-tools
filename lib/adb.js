/*
 * Copyright (C) 2017-2022 UBports Foundation <info@ubports.com>
 * Copyright (C) 2017-2022 Johannah Sprinz <hannah@ubports.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { __awaiter } from "tslib";
import { stat, readdir, mkdir, open, writeFile, readFile } from "node:fs/promises";
import * as path from "node:path";
import { Tool, ToolError } from "./tool.js";
const SERIALNO = /^([0-9]|[a-z])+([0-9a-z]+)$/i;
const DEFAULT_PORT = 5037;
const DEFAULT_HOST = "localhost";
const DEFAULT_PROTOCOL = "tcp";
export class AdbError extends ToolError {
    get message() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
        if (((_a = this.stderr) === null || _a === void 0 ? void 0 : _a.includes("error: device unauthorized")) ||
            ((_b = this.stderr) === null || _b === void 0 ? void 0 : _b.includes("error: device still authorizing"))) {
            return "unauthorized";
        }
        else if (((_c = this.stderr) === null || _c === void 0 ? void 0 : _c.includes("error: device offline")) ||
            ((_d = this.stderr) === null || _d === void 0 ? void 0 : _d.includes("error: protocol fault")) ||
            ((_e = this.stderr) === null || _e === void 0 ? void 0 : _e.includes("connection reset"))) {
            return "device offline";
        }
        else if (((_f = this.stderr) === null || _f === void 0 ? void 0 : _f.includes("no devices/emulators found")) ||
            ((_g = this.stdout) === null || _g === void 0 ? void 0 : _g.includes("no devices/emulators found")) ||
            /device '.*' not found/.test(this.stderr || "") ||
            ((_h = this.stdout) === null || _h === void 0 ? void 0 : _h.includes("adb: error: failed to read copy response")) ||
            ((_j = this.stdout) === null || _j === void 0 ? void 0 : _j.includes("couldn't read from device")) ||
            ((_k = this.stdout) === null || _k === void 0 ? void 0 : _k.includes("remote Bad file number")) ||
            ((_l = this.stdout) === null || _l === void 0 ? void 0 : _l.includes("remote Broken pipe")) ||
            ((_m = this.stderr) === null || _m === void 0 ? void 0 : _m.includes("adb: sideload connection failed: closed")) ||
            ((_o = this.stderr) === null || _o === void 0 ? void 0 : _o.includes("adb: pre-KitKat sideload connection failed: closed"))) {
            return "no device";
        }
        else if ((_p = this.stderr) === null || _p === void 0 ? void 0 : _p.includes("more than one device/emulator")) {
            return "more than one device";
        }
        else {
            return super.message;
        }
    }
}
/** Android Debug Bridge (ADB) module */
export class Adb extends Tool {
    constructor(options = {}) {
        super(Object.assign({ tool: "adb", Error: AdbError, argsModel: {
                allInterfaces: ["-a", false, true],
                useUsb: ["-d", false, true],
                useTcpIp: ["-e", false, true],
                serialno: ["-s", null],
                transportId: ["-t", null],
                host: ["-H", DEFAULT_HOST],
                port: ["-P", DEFAULT_PORT],
                protocol: ["-L", DEFAULT_PROTOCOL, false, "socket"],
                exitOnWriteError: ["--exit-on-write-error", false, true]
            }, config: {
                allInterfaces: false,
                useUsb: false,
                useTcpIp: false,
                serialno: null,
                transportId: null,
                host: DEFAULT_HOST,
                port: DEFAULT_PORT,
                protocol: DEFAULT_PROTOCOL,
                get socket() {
                    return `${this.protocol}:${this.host}:${this.port}`;
                },
                exitOnWriteError: false
            } }, options));
    }
    /** Kill all adb servers and start a new one to rule them all */
    startServer(
    /** new config options to apply */
    options = {}, 
    /** applies the --one-device SERIAL|USB flag, server will only connect to one USB device, specified by a serial number or USB device address */
    serialOrUsbId) {
        return __awaiter(this, void 0, void 0, function* () {
            this.applyConfig(options);
            yield this.killServer().then(() => this.exec("start-server", ...(serialOrUsbId ? ["--one-device", serialOrUsbId] : [])));
        });
    }
    /** Kill all running servers */
    killServer() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("kill-server");
        });
    }
    /** Specifically connect to a device (tcp) */
    connect(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const stdout = yield this.exec("connect", address);
            if (stdout.includes("no devices/emulators found") ||
                stdout.includes("Name or service not known")) {
                throw this.error(new Error("no device"), stdout);
            }
            return this.wait();
        });
    }
    /** kick connection from host side to force reconnect */
    reconnect(modifier) {
        return __awaiter(this, void 0, void 0, function* () {
            const stdout = yield this.exec("reconnect", modifier);
            if (stdout.includes("no devices/emulators found") ||
                stdout.includes("No route to host")) {
                throw this.error(new Error("no device"), stdout);
            }
            return this.wait();
        });
    }
    /** kick connection from device side to force reconnect */
    reconnectDevice() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.reconnect("device");
        });
    }
    /** reset offline/unauthorized devices to force reconnect */
    reconnectOffline() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.reconnect("offline");
        });
    }
    /** list devices */
    devices() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.exec("devices", "-l")
                .then(r => r.replace("List of devices attached", "").trim())
                .then(r => r.split("\n").map(device => device.trim().split(/\s+/)))
                .then(devices => devices
                .filter(([serialno]) => serialno)
                .map(([serialno, mode, ...props]) => Object(props
                .map(p => p.split(":"))
                .reduce((acc, [p, v]) => (Object.assign(Object.assign({}, acc), { [p]: v })), {
                serialno,
                mode
            }))));
        });
    }
    /** Get the devices serial number */
    getSerialno() {
        return __awaiter(this, void 0, void 0, function* () {
            const serialno = yield this.exec("get-serialno");
            if (serialno.includes("unknown") || !SERIALNO.test(serialno)) {
                throw this.error(new Error(`invalid serial number: ${serialno}`), serialno);
            }
            return serialno;
        });
    }
    /** run remote shell command and resolve stdout */
    shell(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.exec("shell", args.join(" "));
        });
    }
    /** determine child_process.spawn() result */
    onCpExit(code, signal, stdout, stderr) {
        return __awaiter(this, void 0, void 0, function* () {
            if (code || signal) {
                // truthy value (i.e. non-zero exit code) indicates error
                if (stdout.includes("adb: error: cannot stat") &&
                    stdout.includes("No such file or directory")) {
                    throw this.error(new Error("file not found"));
                }
                else {
                    throw this.error({ code, signal }, stdout, stderr);
                }
            }
        });
    }
    /** extract chunk size from logging */
    parseChunkSize(str, namespace = "writex") {
        return str.includes(namespace)
            ? parseInt(str.split("len=")[1].split(" ")[0]) || 0
            : 0;
    }
    /** calculate progress from current/total */
    normalizeProgress(current, total) {
        return Math.min(Math.round((current / total) * 100000) / 100000, 1);
    }
    spawnFileTransfer(command, files = [], args = [], progress) {
        return __awaiter(this, void 0, void 0, function* () {
            progress(0);
            if (!files.length) {
                // if there are no files, report 100% and resolve
                progress(1);
                return;
            }
            else {
                const _this = this;
                return new Promise((resolve, reject) => {
                    const totalSize = Promise.all(files.map(file => stat(file).then(({ size }) => size)))
                        .then(sizes => sizes.reduce((a, b) => a + b))
                        .catch(error => {
                        reject(this.error(error));
                        return 0;
                    });
                    let pushedSize = 0;
                    let stdout = "";
                    let stderr = "";
                    const cp = _this
                        ._withEnv({ ADB_TRACE: "rwx" })
                        .spawn(command, ...files, ...args)
                        .once("exit", (code, signal) => resolve(_this.onCpExit(code, signal, stdout, stderr)));
                    cp.stdout.on("data", d => (stdout += d.toString()));
                    cp.stderr.on("data", d => {
                        d.toString()
                            .split("\n")
                            .forEach((str) => __awaiter(this, void 0, void 0, function* () {
                            if (!str.includes("cpp")) {
                                stderr += str;
                            }
                            else {
                                pushedSize += _this.parseChunkSize(str);
                                progress(_this.normalizeProgress(pushedSize, (yield totalSize)));
                            }
                        }));
                    });
                });
            }
        });
    }
    /** copy local files/directories to device */
    push(files = [], dest, progress = () => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.spawnFileTransfer("push", files, [dest], progress);
        });
    }
    /** sideload an ota package */
    sideload(file, progress = () => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.spawnFileTransfer("sideload", [file], [], progress);
        });
    }
    /**
     * Reboot to a state
     * reboot the device; defaults to booting system image but
     * supports bootloader and recovery too. sideload reboots
     * into recovery and automatically starts sideload mode,
     * sideload-auto-reboot is the same but reboots after sideloading.
     */
    reboot(state) {
        return __awaiter(this, void 0, void 0, function* () {
            const stdout = yield this.exec("reboot", state);
            if (stdout.includes("failed")) {
                throw this.error(new Error(`reboot failed`), stdout);
            }
        });
    }
    /** Return the status of the device */
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.exec("get-state").then(stdout => stdout.trim());
        });
    }
    //////////////////////////////////////////////////////////////////////////////
    // Convenience functions
    //////////////////////////////////////////////////////////////////////////////
    /** Reboot to a requested state, if not already in it */
    ensureState(state) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getState().then(currentState => currentState === state
                ? state
                : this.reboot(state).then(() => this.wait()));
        });
    }
    /** read property from getprop or, failing that, the default.prop file */
    getprop(prop) {
        return __awaiter(this, void 0, void 0, function* () {
            const stdout = yield this.shell("getprop", prop);
            if (!stdout || stdout.includes("not found")) {
                return this.shell("cat", "default.prop").then(stdout => {
                    if (stdout && stdout.includes(`${prop}=`)) {
                        return stdout.split(`${prop}=`)[1].split("\n")[0].trim();
                    }
                    else {
                        throw this.error(new Error("unknown getprop error"), stdout);
                    }
                });
            }
            else {
                return stdout;
            }
        });
    }
    /** get device codename from getprop or by reading the default.prop file */
    getDeviceName() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getprop("ro.product.device");
        });
    }
    /** resolves true if recovery is system-image capable, false otherwise */
    getSystemImageCapability() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getprop("ro.ubuntu.recovery")
                .then(r => Boolean(r))
                .catch(e => {
                if (e.message === "unknown getprop error") {
                    return false;
                }
                else {
                    throw e;
                }
            });
        });
    }
    /** Find out what operating system the device is running (currently android and ubuntu touch) */
    getOs() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.shell("cat", "/etc/system-image/channel.ini").then(stdout => {
                return stdout ? "ubuntutouch" : "android";
            });
        });
    }
    /** Find out if a device can be seen by adb */
    hasAccess() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.shell("echo", ".")
                .then(stdout => {
                if (stdout == ".")
                    return true;
                else
                    throw this.error(new Error("unexpected response: " + stdout), stdout);
            })
                .catch(error => {
                if (error.message && error.message.includes("no device")) {
                    return false;
                }
                else {
                    throw error;
                }
            });
        });
    }
    /** wait for a device, optionally limiting to specific states or transport types */
    wait(state = "any", transport = "any") {
        return __awaiter(this, void 0, void 0, function* () {
            return this.exec(`wait-for-${transport}-${state}`).then(() => this.getState());
        });
    }
    /** Format partition */
    format(partition) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.shell("cat", "/etc/recovery.fstab").then(fstab => {
                const block = this.findPartitionInFstab(partition, fstab);
                return this.shell("umount", `/${partition}`)
                    .then(() => this.shell("make_ext4fs", block))
                    .then(() => this.shell("mount", `/${partition}`))
                    .then(error => {
                    if (error)
                        throw this.error(new Error("failed to mount: " + error), error);
                    else
                        return;
                });
            });
        });
    }
    /** Format cache if possible and rm -rf its contents */
    wipeCache() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.format("cache").catch(() => { });
            yield this.shell("rm", "-rf", "/cache/*");
            return;
        });
    }
    /** Find the partition associated with a mountpoint in an fstab */
    findPartitionInFstab(partition, fstab) {
        try {
            return fstab
                .split("\n")
                .filter(block => block.startsWith("/dev"))
                .filter(block => block.split(" ").filter(c => c !== "")[1] === "/" + partition)[0]
                .split(" ")[0];
        }
        catch (error) {
            throw this.error(error);
        }
    }
    /** Find a partition and verify its type */
    verifyPartitionType(partition, type) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.shell("mount").then(stdout => {
                if (!(stdout.includes(" on /") && stdout.includes(" type ")) ||
                    typeof stdout !== "string" ||
                    !stdout.includes("/" + partition)) {
                    throw this.error(new Error("partition not found"), stdout);
                }
                else {
                    return stdout.includes(" on /" + partition + " type " + type);
                }
            });
        });
    }
    /** size of a file or directory */
    getFileSize(file) {
        return __awaiter(this, void 0, void 0, function* () {
            const size = yield this.shell("du -shk " + file);
            if (isNaN(parseFloat(size)))
                throw this.error(new Error(`Cannot parse size from ${size}`), size);
            return parseFloat(size);
        });
    }
    /** available size of a partition */
    getAvailablePartitionSize(partition) {
        return __awaiter(this, void 0, void 0, function* () {
            const size = yield this.shell("df -k -P " + partition)
                .then(stdout => stdout.split(/[ ,]+/))
                .then(arr => parseInt(arr[arr.length - 3]));
            if (isNaN(size))
                throw this.error(new Error(`Cannot parse size from ${size}`));
            return size;
        });
    }
    /** total size of a partition */
    getTotalPartitionSize(partition) {
        return __awaiter(this, void 0, void 0, function* () {
            const size = yield this.shell("df -k -P " + partition)
                .then(stdout => stdout.split(/[ ,]+/))
                .then(arr => parseInt(arr[arr.length - 5]));
            if (isNaN(size))
                throw this.error(new Error(`Cannot parse size from ${size}`));
            return size;
        });
    }
    /** [EXPERIMENTAL] Run a command via adb exec-out and pipe the result to a stream, e.g., from fs.createWriteStream() */
    execOut(writableStream, ...args) {
        return __awaiter(this, void 0, void 0, function* () {
            const _this = this;
            return new Promise(function (resolve, reject) {
                let stderr = "";
                const cp = _this
                    .spawn("exec-out", `'${args.join(" ")}'`)
                    .once("exit", (code, signal) => {
                    writableStream.close();
                    if (code || signal)
                        reject(_this.error({ code, signal }, undefined, stderr));
                    else
                        resolve();
                });
                cp.stdout.pipe(writableStream);
                cp.stderr.on("data", d => (stderr += d.toString()));
            });
        });
    }
    /** [EXPERIMENTAL] Backup "srcfile" from the device to local tar "destfile" */
    createBackupTar(srcfile, destfile, progress) {
        return __awaiter(this, void 0, void 0, function* () {
            progress(0);
            const fileSize = this.getFileSize(srcfile);
            // FIXME with gzip compression (the -z flag on tar), the progress estimate is way off. It's still beneficial to enable it, because it saves a lot of space.
            let timeout;
            const poll = () => __awaiter(this, void 0, void 0, function* () {
                try {
                    const { size } = yield stat(destfile);
                    progress(this.normalizeProgress(size / 1024, yield fileSize));
                }
                catch (e) { }
                timeout = setTimeout(poll, 500);
            });
            poll();
            return open(destfile, "w")
                .then(f => this.execOut(f.createWriteStream(), "tar", "-cpz", "--exclude=*/var/cache ", "--exclude=*/var/log ", "--exclude=*/.cache/upstart ", "--exclude=*/.cache/*.qmlc ", "--exclude=*/.cache/*/qmlcache ", "--exclude=*/.cache/*/qml_cache", srcfile, "2>/dev/null"))
                .finally(() => clearTimeout(timeout));
        });
    }
    /** [EXPERIMENTAL] Restore tar "srcfile" */
    restoreBackupTar(srcfile, progress = () => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            progress(0);
            yield this.ensureState("recovery")
                .then(() => this.shell("mkfifo /restore.pipe"))
                .then(() => Promise.all([
                this.push([srcfile], "/restore.pipe", progress),
                this.shell("cd /;", "cat /restore.pipe | tar -xvz")
            ]))
                .then(() => this.shell("rm", "/restore.pipe"));
        });
    }
    /** List backups */
    listUbuntuBackups(backupBaseDir) {
        return __awaiter(this, void 0, void 0, function* () {
            return readdir(backupBaseDir)
                .then(backups => Promise.all(backups.map(backup => readFile(path.join(backupBaseDir, backup, "metadata.json"))
                .then(r => JSON.parse(r.toString()))
                .then(metadata => (Object.assign(Object.assign({}, metadata), { dir: path.join(backupBaseDir, backup) })))
                .catch(() => null))).then(r => r.filter(r => r)))
                .catch(() => []);
        });
    }
    /** create a full backup of ubuntu touch */
    createUbuntuTouchBackup(backupBaseDir, comment = "", dataPartition = "/data", progress = () => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            progress(0);
            const time = new Date().toISOString();
            const dir = path.join(backupBaseDir, time);
            yield Promise.all([
                mkdir(dir, { recursive: true }),
                this.ensureState("recovery").then(() => Promise.all([
                    this.shell("stat", "/data/user-data"),
                    this.shell("stat", "/data/syste-mdata")
                ]).catch(() => this.shell("mount", dataPartition, "/data")))
            ]);
            yield this.createBackupTar("/data/system-data", path.join(dir, "system.tar.gz"), p => progress(p * 0.5));
            yield this.createBackupTar("/data/user-data", path.join(dir, "user.tar.gz"), p => progress(50 + p * 0.5));
            const codename = yield this.getDeviceName();
            const serialno = yield this.getSerialno();
            const metadata = {
                codename,
                serialno,
                size: (yield this.getFileSize("/data/user-data")) +
                    (yield this.getFileSize("/data/system-data")),
                time,
                comment: comment || `Ubuntu Touch backup created on ${time}`,
                restorations: []
            };
            yield writeFile(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, "  "));
            return Object.assign(Object.assign({}, metadata), { dir });
        });
    }
    /** restore a full backup of ubuntu touch */
    restoreUbuntuTouchBackup(dir, progress = () => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            progress(0); // FIXME report actual push progress
            const time = new Date().toISOString();
            const metadata = JSON.parse(yield readFile(path.join(dir, "metadata.json"), { encoding: "utf-8" }));
            const codename = yield this.getDeviceName();
            const serialno = yield this.getSerialno();
            metadata.restorations = [
                ...(metadata.restorations || []),
                { codename, serialno, time }
            ];
            yield this.ensureState("recovery");
            progress(10);
            yield this.restoreBackupTar(path.join(dir, "system.tar.gz"));
            progress(50);
            yield this.restoreBackupTar(path.join(dir, "user.tar.gz"));
            progress(90);
            yield Promise.all([
                writeFile(path.join(dir, "metadata.json"), JSON.stringify(metadata, null, "  ")),
                this.reboot()
            ]);
            progress(100);
            return Object.assign(Object.assign({}, metadata), { dir });
        });
    }
}
//# sourceMappingURL=adb.js.map