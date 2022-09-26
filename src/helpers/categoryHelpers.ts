import fakeyou, { VoiceCategory } from './../api/fakeyou';
import store from './../util/store';

async function getCategoryList(filter?: (category: VoiceCategory) => boolean): Promise<VoiceCategory[]> {
    let categories: VoiceCategory[] | null = store.get('categories');
    if (categories === null) {
        const response = await fakeyou.getCategoryList();
        categories = response.categories;
        store.set('categories', categories);
    }

    if (filter) {
        categories = categories.filter(filter);
    }

    return categories;
}

async function getAllSubCategories(category: VoiceCategory, depth?: number): Promise<VoiceCategory[]> {
    const subCategories: VoiceCategory[] = [];
    
    depth = depth != null ? depth : Number.MAX_SAFE_INTEGER;
    if (!category.haveSubCategories || depth < 1) {
        return subCategories;
    }

    const childCategories = await getCategoryList((cat) => cat.superCategoryToken === category.token);
    subCategories.push(...childCategories);
    
    for (const childCat of childCategories) {
        const childCatSubCategories = await getAllSubCategories(childCat, --depth);
        subCategories.push(...childCatSubCategories);
    }

    return subCategories;
}

export default {
    getCategoryList,
    getAllSubCategories
};
