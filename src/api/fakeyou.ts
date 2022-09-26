import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const FAKEYOU_API_URL = 'https://api.fakeyou.com/';
const STORAGE_API_URL = 'https://storage.googleapis.com/vocodes-public/';

export interface VoiceModel {
    token: string;
    name: string;
    languague: string;
    categoryTokens: string[];
}

export interface GetVoiceListResponse {
    success: boolean;
    voices: VoiceModel[];
}

const getVoiceList = async (): Promise<GetVoiceListResponse> => {
    const response = await axios.get('tts/list', { baseURL: FAKEYOU_API_URL });
    const data = response.data;
    const models: any[] = data.models;
    const voices: VoiceModel[] = models.map<VoiceModel>((model) => ({
        token: model.model_token,
        name: model.title,
        languague: model.ietf_primary_language_subtag,
        categoryTokens: model.category_tokens
    }));

    return { success: data.success, voices };
};

export interface VoiceCategory {
    token: string;
    superCategoryToken: string | null;
    name: string;
    haveSuperCategory: boolean;
    haveSubCategories: boolean;
    haveModels: boolean;
}

export interface GetCategoryListResponse {
    success: boolean;
    categories: VoiceCategory[];
}

const getCategoryList = async (): Promise<GetCategoryListResponse> => {
    const response = await axios.get('category/list/tts', { baseURL: FAKEYOU_API_URL });
    const data = response.data;
    const apiCategories: any[] = data.categories;
    const categories = apiCategories.map<VoiceCategory>((category) => ({
        token: category.category_token,
        superCategoryToken: category.maybe_super_category_token,
        name: category.name,
        haveSubCategories: category.can_have_subcategories,
        haveSuperCategory: category.maybe_super_category_token != null,
        haveModels: category.can_directly_have_models
    }));

    return { success: data.success, categories };
};

export interface RequestTTSResponse {
    success: boolean;
    idempotencyToken: string;
    jobToken: string;
}

const requestTTS = async (voiceToken: string, text: string): Promise<RequestTTSResponse> => {
    const idempotencyToken = uuidv4();
    const response = await axios.post('tts/inference', {
        uuid_idempotency_token: idempotencyToken,
        tts_model_token: voiceToken,
        inference_text: text
    }, { baseURL: FAKEYOU_API_URL});
    const data = response.data;

    return {
        success: data.success,
        idempotencyToken,
        jobToken: data.inference_job_token
    };
};

export type TTSStatus = 'pending' | 'started' | 'complete_success' | 'complete_failure' | 'attempt_failed' | 'dead';

export interface FetchTTSStatusResponse {
    success: boolean;
    job: {
        status: TTSStatus;
        audioEndpoint: string;
        inferenceText: string;
        attemptCount: number;
    };
}

const fetchTTSStatus = async (jobToken: string): Promise<FetchTTSStatusResponse> => {
    const response = await axios.get(`tts/job/${jobToken}`, { baseURL: FAKEYOU_API_URL });
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
};

const downloadFile = async function (endpoint: string): Promise<Buffer> {
    const response = await axios.get<ArrayBuffer>(endpoint, { 
        baseURL: STORAGE_API_URL,
        responseType: 'arraybuffer'
    });
    
    return Buffer.from(response.data);
};

export default {
    getVoiceList,
    getCategoryList,
    requestTTS,
    fetchTTSStatus,
    downloadFile
};
