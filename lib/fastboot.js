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
import { Tool, ToolError } from "./tool.js";
export class FastbootError extends ToolError {
    get message() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w;
        if ((_a = this.stderr) === null || _a === void 0 ? void 0 : _a.includes("FAILED (remote: low power, need battery charging.)")) {
            return "low battery";
        }
        else if (((_b = this.stderr) === null || _b === void 0 ? void 0 : _b.includes("not supported in locked device")) ||
            ((_c = this.stderr) === null || _c === void 0 ? void 0 : _c.includes("Bootloader is locked")) ||
            ((_d = this.stderr) === null || _d === void 0 ? void 0 : _d.includes("not allowed in locked state")) ||
            ((_e = this.stderr) === null || _e === void 0 ? void 0 : _e.includes("not allowed in Lock State")) ||
            ((_f = this.stderr) === null || _f === void 0 ? void 0 : _f.includes("Device not unlocked cannot flash or erase")) ||
            ((_g = this.stderr) === null || _g === void 0 ? void 0 : _g.includes("Partition flashing is not allowed")) ||
            ((_h = this.stderr) === null || _h === void 0 ? void 0 : _h.includes("Command not allowed")) ||
            ((_j = this.stderr) === null || _j === void 0 ? void 0 : _j.includes("not allowed when locked")) ||
            ((_k = this.stderr) === null || _k === void 0 ? void 0 : _k.includes("device is locked. Cannot flash images")) ||
            ((_l = this.stderr) === null || _l === void 0 ? void 0 : _l.match(/download for partition '[a-z]+' is not allowed/i))) {
            return "bootloader locked";
        }
        else if (((_m = this.stderr) === null || _m === void 0 ? void 0 : _m.includes("Check 'Allow OEM Unlock' in Developer Options")) ||
            ((_o = this.stderr) === null || _o === void 0 ? void 0 : _o.includes("Unlock operation is not allowed")) ||
            ((_p = this.stderr) === null || _p === void 0 ? void 0 : _p.includes("oem unlock is not allowed"))) {
            return "enable unlocking";
        }
        else if ((_q = this.stderr) === null || _q === void 0 ? void 0 : _q.includes("FAILED (remote failure)")) {
            return "failed to boot";
        }
        else if (((_r = this.stderr) === null || _r === void 0 ? void 0 : _r.includes("I/O error")) ||
            ((_s = this.stderr) === null || _s === void 0 ? void 0 : _s.includes("FAILED (command write failed (No such device))")) ||
            ((_t = this.stderr) === null || _t === void 0 ? void 0 : _t.includes("FAILED (command write failed (Success))")) ||
            ((_u = this.stderr) === null || _u === void 0 ? void 0 : _u.includes("FAILED (status read failed (No such device))")) ||
            ((_v = this.stderr) === null || _v === void 0 ? void 0 : _v.includes("FAILED (data transfer failure (Broken pipe))")) ||
            ((_w = this.stderr) === null || _w === void 0 ? void 0 : _w.includes("FAILED (data transfer failure (Protocol error))"))) {
            return "no device";
        }
        else {
            return super.message;
        }
    }
}
/** fastboot android flashing and booting utility */
export class Fastboot extends Tool {
    constructor(options = {}) {
        super(Object.assign({ tool: "fastboot", Error: FastbootError, argsModel: {
                wipe: ["-w", false, true],
                device: ["-s", null],
                maxSize: ["-S", null],
                force: ["--force", false, true],
                slot: ["--slot", null],
                setActive: ["--set-active", null],
                skipSecondary: ["--skip-secondary", false, true],
                skipReboot: ["--skip-reboot", false, true],
                disableVerity: ["--disable-verity", false, true],
                disableVerification: ["--disable-verification", false, true],
                fsOptions: ["--fs-options", null],
                unbuffered: ["--unbuffered", false, true]
            }, config: {
                wipe: false,
                device: null,
                maxSize: null,
                force: false,
                slot: null,
                setActive: null,
                skipSecondary: false,
                skipReboot: false,
                disableVerity: false,
                disableVerification: false,
                fsOptions: null,
                unbuffered: false
            } }, options));
    }
    /** Write a file to a flash partition */
    flash(images, progress = () => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            progress(0);
            const _this = this;
            // build a promise chain to flash all images sequentially
            yield images.reduce((prev, { raw, partition, flags, file }, i) => prev.then(() => new Promise((resolve, reject) => {
                let stdout = "";
                let stderr = "";
                let offset = i / images.length;
                let scale = 1 / images.length;
                let sparseCurr = 1;
                let sparseTotal = 1;
                let sparseOffset = () => (sparseCurr - 1) / sparseTotal;
                let sparseScale = () => 1 / sparseTotal;
                const cp = _this.spawn(raw ? "flash:raw" : "flash", partition, ...(flags || []), file);
                cp.once("exit", (code, signal) => {
                    if (code || signal) {
                        reject(_this.error({ code, signal }, stdout, stderr));
                    }
                    else {
                        resolve("bootloader");
                    }
                });
                cp.stdout.on("data", d => (stdout += d.toString()));
                cp.stderr.on("data", d => {
                    d.toString()
                        .trim()
                        .split("\n")
                        .forEach((str) => {
                        // FIXME improve and simplify logic
                        try {
                            if (!str.includes("OKAY")) {
                                if (str.includes(`Sending '${partition}'`)) {
                                    progress(offset + 0.3 * scale);
                                }
                                else if (str.includes(`Sending sparse '${partition}'`)) {
                                    [sparseCurr, sparseTotal] = str
                                        .split(/' |\/| \(/)
                                        .slice(1, 3)
                                        .map(parseFloat);
                                    progress(offset +
                                        sparseOffset() * scale +
                                        sparseScale() * 0.33 * scale);
                                }
                                else if (str.includes(`Writing '${partition}'`)) {
                                    progress(offset +
                                        sparseOffset() * scale +
                                        sparseScale() * 0.85 * scale);
                                }
                                else if (str.includes(`Finished '${partition}'`)) {
                                    progress(offset + scale);
                                }
                                else {
                                    throw this.error(new Error(`failed to parse: ${str}`), undefined, d.toString().trim());
                                }
                            }
                        }
                        catch (e) {
                            stderr += str;
                        }
                    });
                });
            })), _this.wait());
        });
    }
    /** Download and boot kernel */
    boot(image) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("boot", image);
        });
    }
    /** Reflash device from update.zip and set the flashed slot as active */
    update(image, wipe = false) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this._withConfig({ wipe }).exec("update", image);
        });
    }
    /** Reboot device into bootloader */
    rebootBootloader() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("reboot-bootloader");
        });
    }
    /**
     * Reboot device into userspace fastboot (fastbootd) mode
     * Note: this only works on devices that support dynamic partitions.
     */
    rebootFastboot() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("reboot-fastboot");
        });
    }
    /** Reboot device into recovery */
    rebootRecovery() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("reboot-recovery");
        });
    }
    /** Reboot device */
    reboot() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("reboot");
        });
    }
    /** Continue with autoboot */
    continue() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("continue");
        });
    }
    /** Format a flash partition. Can override the fs type and/or size the bootloader reports */
    format(partition, type, size) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!type && size) {
                throw this.error({
                    message: "size specification requires type to be specified as well"
                });
            }
            yield this.exec(`format${type ? ":" + type : ""}${size ? ":" + size : ""}`, partition);
        });
    }
    /** Erase a flash partition */
    erase(partition) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("erase", partition);
        });
    }
    /** Sets the active slot */
    setActive(slot) {
        return this._withConfig({ setActive: slot })
            .exec()
            .then(stdout => {
            if (stdout && stdout.includes("error")) {
                throw this.error(new Error("failed to set active slot"), stdout);
            }
            else {
                return;
            }
        });
    }
    /** Create a logical partition with the given name and size, in the super partition */
    createLogicalPartition(partition, size) {
        return this.exec("create-logical-partition", partition, size).then(() => { });
    }
    /** Resize a logical partition with the given name and final size, in the super partition */
    resizeLogicalPartition(partition, size) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("resize-logical-partition", partition, size);
        });
    }
    /** Delete a logical partition with the given name */
    deleteLogicalPartition(partition) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("delete-logical-partition", partition);
        });
    }
    /** Wipe the super partition and reset the partition layout */
    wipeSuper(image) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("wipe-super", image);
        });
    }
    //////////////////////////////////////////////////////////////////////////////
    // Convenience functions
    //////////////////////////////////////////////////////////////////////////////
    /** Lift OEM lock */
    oemUnlock(
    /** optional unlock code (including 0x if necessary) */
    code) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.exec("oem", "unlock", code);
            }
            catch (error) {
                if (!(error instanceof Error &&
                    error.message.match(/Already Unlocked|Not necessary/)))
                    throw error;
            }
        });
    }
    /** Enforce OEM lock */
    oemLock() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("oem", "lock");
        });
    }
    /** unlock partitions for flashing */
    flashingUnlock() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("flashing", "unlock");
        });
    }
    /** lock partitions for flashing */
    flashingLock() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("flashing", "lock");
        });
    }
    /** unlock 'critical' bootloader partitions */
    flashingUnlockCritical() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("flashing", "unlock_critical");
        });
    }
    /** lock 'critical' bootloader partitions */
    flashingLockCritical() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exec("flashing", "lock_critical");
        });
    }
    /** Find out if a device can be flashing-unlocked */
    getUnlockAbility() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.exec("flashing", "get_unlock_ability")
                .then(stdout => stdout === "1")
                .catch(() => false);
        });
    }
    /** Find out if a device can be seen by fastboot */
    hasAccess() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.exec("devices")).includes("fastboot");
        });
    }
    /** wait for a device */
    wait() {
        const _super = Object.create(null, {
            wait: { get: () => super.wait }
        });
        return __awaiter(this, void 0, void 0, function* () {
            yield _super.wait.call(this);
            return "bootloader";
        });
    }
    /** get bootloader var */
    getvar(variable) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exec("getvar", variable);
            const [name, value] = result
                .replace(/\r\n/g, "\n")
                .split("\n")[0]
                .split(": ");
            if (name !== variable) {
                throw this.error(new Error(`Unexpected getvar return: "${name}"`), result);
            }
            return value;
        });
    }
    /** get device codename from product bootloader var */
    getDeviceName() {
        return this.getvar("product");
    }
}
//# sourceMappingURL=fastboot.js.map