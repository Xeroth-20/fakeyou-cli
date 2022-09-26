"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configstore_1 = __importDefault(require("configstore"));
const pkg = require('./../../package.json');
const store = new configstore_1.default(pkg.name, {
    version: pkg.version,
    voices: null,
    categories: null
});
exports.default = store;
//# sourceMappingURL=store.js.map