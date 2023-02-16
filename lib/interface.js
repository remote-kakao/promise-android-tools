/*
 * Copyright (C) 2022 UBports Foundation <info@ubports.com>
 * Copyright (C) 2022 Johannah Sprinz <hannah@ubports.com>
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
import { __awaiter, __decorate, __metadata } from "tslib";
import { EventEmitter } from "node:events";
import { use } from "typescript-mix";
import { HierarchicalAbortController } from "./hierarchicalAbortController.js";
export class Interface extends HierarchicalAbortController {
    /** returns clone listening to additional AbortSignals */
    _withSignals(...signals) {
        const ret = Object.create(this);
        Object.defineProperty(ret, "signal", {
            value: new HierarchicalAbortController(this.signal, ...signals).signal
        });
        return ret;
    }
    /** returns clone that will time out after the spelistening to an additional timeout abortSignal */
    _withTimeout(msecs = 1000) {
        return this._withSignals(AbortSignal.timeout(msecs));
    }
    /**
     * Find out if a device can be seen
     * @virtual
     */
    hasAccess() {
        return __awaiter(this, void 0, void 0, function* () {
            return false;
        });
    }
}
__decorate([
    use(EventEmitter, HierarchicalAbortController),
    __metadata("design:type", Interface)
], Interface.prototype, "this", void 0);
//# sourceMappingURL=interface.js.map