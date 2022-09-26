import fakeyou, { VoiceCategory, VoiceModel } from './../api/fakeyou';
import store from './../util/store';

interface VoiceFilter {
    (voice: VoiceModel): boolean;
}

async function getVoiceList(filter?: VoiceFilter): Promise<VoiceModel[]> {
    let voices: VoiceModel[] | null = store.get('voices');
    if (voices === null) {
        const response = await fakeyou.getVoiceList();
        voices = response.voices;
        store.set('voices', voices);
    }

    if (filter) {
        voices = voices.filter(filter);
    }

    return voices;
}

async function getVoiceListByCategory(category: VoiceCategory, filter?: VoiceFilter): Promise<VoiceModel[]> {
    const voices = await getVoiceList(filter);
    const filterByCategory: VoiceFilter = (voice: VoiceModel) => {
        return voice.categoryTokens.includes(category.token);
    };
    
    return voices.filter(filterByCategory);
}

async function getVoiceListByCategories(categories: VoiceCategory[], filter?: VoiceFilter): Promise<VoiceModel[]> {
    const voices = await getVoiceList(filter);
    const categoryTokens = categories.map((category) => category.token);
    const filteredVoices = voices.filter((voice) => {
        return voice.categoryTokens.some((token) => categoryTokens.includes(token));
    });

    return filteredVoices;
}

export default {
    getVoiceList,
    getVoiceListByCategory,
    getVoiceListByCategories
};
