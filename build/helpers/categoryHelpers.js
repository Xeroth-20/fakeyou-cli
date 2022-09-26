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
function getCategoryList(filter) {
    return __awaiter(this, void 0, void 0, function* () {
        let categories = store_1.default.get('categories');
        if (categories === null) {
            const response = yield fakeyou_1.default.getCategoryList();
            categories = response.categories;
            store_1.default.set('categories', categories);
        }
        if (filter) {
            categories = categories.filter(filter);
        }
        return categories;
    });
}
function getAllSubCategories(category, depth) {
    return __awaiter(this, void 0, void 0, function* () {
        const subCategories = [];
        depth = depth != null ? depth : Number.MAX_SAFE_INTEGER;
        if (!category.haveSubCategories || depth < 1) {
            return subCategories;
        }
        const childCategories = yield getCategoryList((cat) => cat.superCategoryToken === category.token);
        subCategories.push(...childCategories);
        for (const childCat of childCategories) {
            const childCatSubCategories = yield getAllSubCategories(childCat, --depth);
            subCategories.push(...childCatSubCategories);
        }
        return subCategories;
    });
}
exports.default = {
    getCategoryList,
    getAllSubCategories
};
//# sourceMappingURL=categoryHelpers.js.map