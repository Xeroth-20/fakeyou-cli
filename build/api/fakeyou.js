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
const axios_1 = __importDefault(require("axios"));
const uuid_1 = require("uuid");
const FAKEYOU_API_URL = 'https://api.fakeyou.com/';
const STORAGE_API_URL = 'https://storage.googleapis.com/vocodes-public/';
const getVoiceList = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get('tts/list', { baseURL: FAKEYOU_API_URL });
    const data = response.data;
    const models = data.models;
    const voices = models.map((model) => ({
        token: model.model_token,
        name: model.title,
        languague: model.ietf_primary_language_subtag,
        categoryTokens: model.category_tokens
    }));
    return { success: data.success, voices };
});
const getCategoryList = () => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get('category/list/tts', { baseURL: FAKEYOU_API_URL });
    const data = response.data;
    const apiCategories = data.categories;
    const categories = apiCategories.map((category) => ({
        token: category.category_token,
        superCategoryToken: category.maybe_super_category_token,
        name: category.name,
        haveSubCategories: category.can_have_subcategories,
        haveSuperCategory: category.maybe_super_category_token != null,
        haveModels: category.can_directly_have_models
    }));
    return { success: data.success, categories };
});
const requestTTS = (voiceToken, text) => __awaiter(void 0, void 0, void 0, function* () {
    const idempotencyToken = (0, uuid_1.v4)();
    const response = yield axios_1.default.post('tts/inference', {
        uuid_idempotency_token: idempotencyToken,
        tts_model_token: voiceToken,
        inference_text: text
    }, { baseURL: FAKEYOU_API_URL });
    const data = response.data;
    return {
        success: data.success,
        idempotencyToken,
        jobToken: data.inference_job_token
    };
});
const fetchTTSStatus = (jobToken) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(`tts/job/${jobToken}`, { baseURL: FAKEYOU_API_URL });
    const data = response.data;
    return {
        success: data.success,
        job: {
            status: data.state.status,
            audioEndpoint: data.state.maybe_public_bucket_wav_audio_path,
            inferenceText: data.state.raw_inference_text,
            attemptCount: data.state.attempt_count
        }
    };
});
const downloadFile = function (endpoint) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(endpoint, {
            baseURL: STORAGE_API_URL,
            responseType: 'arraybuffer'
        });
        return Buffer.from(response.data);
    });
};
exports.default = {
    getVoiceList,
    getCategoryList,
    requestTTS,
    fetchTTSStatus,
    downloadFile
};
//# sourceMappingURL=fakeyou.js.map