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
var _Tool_instances, _Tool_initializeArgs;
import { __awaiter, __classPrivateFieldGet, __rest } from "tslib";
import { exec, spawn } from "./exec.js";
import { getAndroidToolPath as toolPath, getAndroidToolBaseDir as toolBaseDir, } from "android-tools-bin";
import * as common from "./common.js";
import { Interface } from "./interface.js";
import { normalize } from "node:path";
export class ToolError extends Error {
    get message() {
        var _a;
        if (this.killed) {
            return "aborted";
        }
        else {
            return (((_a = this.cause) === null || _a === void 0 ? void 0 : _a.message) ||
                (common.removeFalsy(this.cause)
                    ? JSON.stringify(common.removeFalsy({
                        error: this.cause,
                        stdout: this.stdout,
                        stderr: this.stderr,
                    }))
                    : this.name));
        }
    }
    get name() {
        return this.constructor.name;
    }
    get cmd() {
        var _a;
        return (_a = this.cause) === null || _a === void 0 ? void 0 : _a.cmd;
    }
    get killed() {
        var _a, _b, _c, _d, _e;
        return (((_a = this.cause) === null || _a === void 0 ? void 0 : _a.killed) ||
            ((_c = (_b = this.cause) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.includes("aborted")) ||
            ((_d = this.stderr) === null || _d === void 0 ? void 0 : _d.includes("Killed")) ||
            ((_e = this.stderr) === null || _e === void 0 ? void 0 : _e.includes("killed by remote request")) === true);
    }
    constructor(
    /** error returned by exec() */
    error, 
    /** standard output */
    stdout, 
    /** standard error */
    stderr) {
        super(undefined, { cause: error });
        this.stdout = stdout;
        this.stderr = stderr;
    }
}
/**
 * generic tool class
 */
export class Tool extends Interface {
    /** environment variables */
    get env() {
        return Object.assign(Object.assign({}, process.env), this.extraEnv);
    }
    /** cli arguments */
    get args() {
        return [
            ...this.extraArgs,
            ...Object.entries(this.argsModel).map(([key, [flag, defaultValue, noArgs, overrideKey]]) => this.config[key] !== defaultValue
                ? noArgs
                    ? [flag]
                    : [flag, this.config[overrideKey || key]]
                : []),
        ].flat();
    }
    constructor(_a) {
        var { tool, Error = ToolError, signals = [], extraArgs = [], extraEnv = {}, setPath = false, config = {}, argsModel = {} } = _a, options = __rest(_a, ["tool", "Error", "signals", "extraArgs", "extraEnv", "setPath", "config", "argsModel"]);
        super();
        _Tool_instances.add(this);
        this.tool = tool;
        this.executable = normalize(toolPath(this.tool));
        this.Error = Error;
        this.listen(...signals);
        this.extraArgs = extraArgs;
        this.extraEnv = extraEnv;
        if (setPath)
            this.env.PATH = `${toolBaseDir()}:${this.env.PATH}`;
        __classPrivateFieldGet(this, _Tool_instances, "m", _Tool_initializeArgs).call(this, config, argsModel);
        this.applyConfig(options);
    }
    /** return a clone with a specified variation in the config options */
    _withConfig(config) {
        const ret = Object.create(this);
        ret.config = Object.assign({}, this.config);
        for (const key in config) {
            if (Object.hasOwnProperty.call(config, key)) {
                ret.config[key] = config[key];
            }
        }
        return ret;
    }
    /** returns clone with variation in env vars */
    _withEnv(env) {
        const ret = Object.create(this);
        ret.extraEnv = Object.assign({}, this.extraEnv);
        for (const key in env) {
            if (Object.hasOwnProperty.call(env, key)) {
                ret.extraEnv[key] = env[key];
            }
        }
        return ret;
    }
    /** apply config options to the tool instance */
    applyConfig(config) {
        for (const key in this.config) {
            if (Object.getOwnPropertyDescriptor(this.config, key).writable &&
                Object.hasOwn(config, key)) {
                this.config[key] = config[key];
            }
        }
    }
    /** filter nullish and empty-string arguments */
    constructArgs(args) {
        return [...this.args, ...args]
            .filter((arg) => ![null, undefined, ""].includes(arg))
            .flat();
    }
    /** Execute a command. Used for quick operations that do not require real-time data access. Output is trimmed. */
    exec(...args) {
        return __awaiter(this, void 0, void 0, function* () {
            this.signal.throwIfAborted();
            const allArgs = this.constructArgs(args);
            const cmd = [this.tool, ...allArgs];
            return exec(this.executable, allArgs, {
                encoding: "utf8",
                signal: this.signal,
                env: this.env,
            })
                .then(({ stdout, stderr }) => {
                this.emit("exec", common.removeFalsy({ cmd, stdout, stderr }));
                return stdout.trim() || stderr.trim();
            })
                .catch(({ message, code, signal, killed, stdout, stderr }) => {
                const error = this.error({ message, code, signal, killed }, stdout, stderr);
                this.emit("exec", common.removeFalsy({ cmd, error, stdout, stderr }));
                throw error;
            });
        });
    }
    /** Spawn a child process. Used for long-running operations that require real-time data access. */
    spawn(...args) {
        this.signal.throwIfAborted();
        const allArgs = this.constructArgs(args);
        const cmd = [this.tool, ...allArgs];
        this.emit("spawn:start", common.removeFalsy({ cmd }));
        const cp = spawn(this.executable, allArgs, {
            env: this.env,
            signal: this.signal,
        });
        cp.on("exit", (code, signal) => this.emit("spawn:exit", common.removeFalsy({ cmd, code, signal })));
        cp.on("error", (error) => this.emit("spawn:error", common.removeFalsy({ cmd, error })));
        return cp;
    }
    /** Parse and simplify errors */
    error(error, stdout, stderr) {
        var _a, _b;
        error.message && (error.message = (_b = (_a = error.message) === null || _a === void 0 ? void 0 : _a.replaceAll(this.executable, this.tool)) === null || _b === void 0 ? void 0 : _b.trim());
        return new this.Error(error, stdout === null || stdout === void 0 ? void 0 : stdout.replaceAll(this.executable, this.tool), stderr === null || stderr === void 0 ? void 0 : stderr.replaceAll(this.executable, this.tool));
    }
    /** Wait for a device */
    wait() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => setTimeout(resolve, 2000))
                .then(() => this.hasAccess())
                .then((access) => {
                if (!access) {
                    this.signal.throwIfAborted();
                    return this.wait();
                }
            });
        });
    }
}
_Tool_instances = new WeakSet(), _Tool_initializeArgs = function _Tool_initializeArgs(config, argsModel) {
    this.config = config;
    this.argsModel = argsModel;
    for (const key in this.argsModel) {
        if (Object.hasOwn(this.argsModel, key)) {
            const [_arg, defaultValue, isFlag] = this.argsModel[key];
            this[`__${key}`] = function (val) {
                return this._withConfig({ [key]: isFlag ? !defaultValue : val });
            };
        }
    }
};
//# sourceMappingURL=tool.js.map