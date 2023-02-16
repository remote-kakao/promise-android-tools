/*
 * Copyright (C) 2019-2022 UBports Foundation <info@ubports.com>
 * Copyright (C) 2019-2022 Johannah Sprinz <hannah@ubports.com>
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
export class HeimdallError extends ToolError {
    get message() {
        var _a;
        if ((_a = this.stderr) === null || _a === void 0 ? void 0 : _a.includes("Failed to detect")) {
            return "no device";
        }
        else {
            return super.message;
        }
    }
}
/** heimdall: flash firmware on samsung devices */
export class Heimdall extends Tool {
    constructor(options = {}) {
        super(Object.assign({ tool: "heimdall", Error: HeimdallError }, options));
    }
    /** Find out if a device in download mode can be seen by heimdall */
    detect() {
        return this.hasAccess();
    }
    /** Find out if a device in download mode can be seen by heimdall */
    hasAccess() {
        return this.exec("detect")
            .then(() => true)
            .catch(error => {
            if (error.message.includes("no device")) {
                return false;
            }
            else {
                throw error;
            }
        });
    }
    /** Wait for a device */
    wait() {
        return super.wait().then(() => "download");
    }
    /** Prints the contents of a PIT file in a human readable format. If a filename is not provided then Heimdall retrieves the PIT file from the connected device. */
    printPit(file) {
        return this.exec("print-pit", ...(file ? ["--file", file] : [])).then(r => r
            .split("\n\nEnding session...")[0]
            .split(/--- Entry #\d ---/)
            .slice(1)
            .map(r => r.trim()));
    }
    /** get partitions from pit file */
    getPartitions() {
        return this.printPit().then(r => r.map(r => r
            .split("\n")
            .map(r => r.split(":").map(r => r.trim()))
            .reduce((result, item) => {
            result[item[0]] = item[1];
            return result;
        }, {})));
    }
    /** Flash firmware files to partitions (names or identifiers) */
    flash(images) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO report progress similar to fastboot.flash()
            yield this.exec("flash", ...images.map(i => [`--${i.partition}`, i.file]).flat());
        });
    }
}
//# sourceMappingURL=heimdall.js.map