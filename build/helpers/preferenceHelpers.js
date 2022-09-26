"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const store_1 = __importDefault(require("./../util/store"));
function getVersion() {
    const pkg = require('./../../package.json');
    let version = store_1.default.get('version');
    // Check current stored version
    if (version !== pkg.version) {
        version = pkg.version;
        store_1.default.set('version', version);
    }
    return version;
}
exports.default = {
    getVersion
};
//# sourceMappingURL=preferenceHelpers.js.map