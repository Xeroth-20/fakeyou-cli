"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fakeyou_1 = __importDefault(require("./../api/fakeyou"));
const store_1 = __importDefault(require("./../util/store"));
function getVoiceList(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        let voices = store_1.default.get('voices');
        if (voices === null) {
            const response = yield fakeyou_1.default.getVoiceList();
            voices = response.voices;
            store_1.default.set('voices', voices);
        }
        if (filter) {
            voices = voices.filter(filter);
        }
        return voices;
    });
}
function getVoiceListByCategory(category, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const voices = yield getVoiceList(filter);
        const filterByCategory = (voice) => {
            return voice.categoryTokens.includes(category.token);
        };
        return voices.filter(filterByCategory);
    });
}
function getVoiceListByCategories(categories, filter) {
    return __awaiter(this, void 0, void 0, function* () {
        const voices = yield getVoiceList(filter);
        const categoryTokens = categories.map((category) => category.token);
        const filteredVoices = voices.filter((voice) => {
            return voice.categoryTokens.some((token) => categoryTokens.includes(token));
        });
        return filteredVoices;
    });
}
exports.default = {
    getVoiceList,
    getVoiceListByCategory,
    getVoiceListByCategories
};
//# sourceMappingURL=voiceHelpers.js.map