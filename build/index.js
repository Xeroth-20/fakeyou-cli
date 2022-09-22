#!/usr/bin/env node
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
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const inquirer_1 = __importDefault(require("inquirer"));
const figlet_1 = __importDefault(require("figlet"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const nanospinner_1 = __importDefault(require("nanospinner"));
const fakeyou_1 = __importDefault(require("./api/fakeyou"));
const pkg = require('./../package.json');
const CLI_VERSION = pkg.version;
const FETCH_INTERVAL = 1000; // 1 seconds
const NO_OPTION = {
    name: '(Quit)',
    value: 'None'
};
function welcome() {
    const title = figlet_1.default.textSync('FakeYou').replace(/\s*\n\s*$/, ` ${CLI_VERSION}\n`);
    const description = 'Use Fake You deep fake technology to say things with your favorite characters\n';
    console.log(gradient_string_1.default.passion.multiline(title));
    console.log(gradient_string_1.default.passion.multiline(description));
}
function askVoiceCategory() {
    return __awaiter(this, void 0, void 0, function* () {
        const { categories } = yield fakeyou_1.default.getCategoryList();
        const filteredCategories = categories.filter((category) => !category.haveSuperCategory && category.name);
        const answers = yield inquirer_1.default.prompt({
            type: 'list',
            name: 'voice_category',
            message: `Select a voice category (${filteredCategories.length})`,
            choices: filteredCategories.map((category) => ({
                name: category.name,
                value: category.token
            }))
        });
        return answers.voice_category;
    });
}
function askVoiceModel(categoryToken) {
    return __awaiter(this, void 0, void 0, function* () {
        const { voices } = yield fakeyou_1.default.getVoiceList();
        const filteredVoices = voices.filter((voice) => voice.categoryTokens.includes(categoryToken) && voice.name);
        const choices = filteredVoices.map((voice) => ({
            name: voice.name,
            value: voice.token
        }));
        choices.push(NO_OPTION);
        const answers = yield inquirer_1.default.prompt({
            type: 'list',
            name: 'voice_model',
            message: `Select a voice model (${filteredVoices.length})`,
            choices: choices
        });
        return answers.voice_model;
    });
}
;
function askText() {
    return __awaiter(this, void 0, void 0, function* () {
        const answers = yield inquirer_1.default.prompt({
            type: 'input',
            name: 'text',
            message: 'Enter funny text',
            validate: (input) => {
                const trimmedInput = input.trim();
                if (trimmedInput.length === 0)
                    return 'Required';
                else if (trimmedInput.length < 3)
                    return 'At least 3 characters required';
                return true;
            }
        });
        return answers.text;
    });
}
function downloadAudio(jobToken) {
    const availabilityText = (seconds) => `Waiting for file availability... ⌛${seconds}s`;
    const waitingSpinner = nanospinner_1.default.createSpinner(availabilityText(0)).start();
    const startTime = Date.now();
    return new Promise((resolve) => {
        const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            const currentTime = Date.now();
            const elapsedMillis = currentTime - startTime;
            const elapsedSeconds = Math.floor(elapsedMillis / 1000);
            const { job: { status, audioEndpoint } } = yield fakeyou_1.default.fetchTTSStatus(jobToken);
            if (status === 'complete_success') {
                clearInterval(timer);
                waitingSpinner.success({ text: 'Your audio file is available' });
                const downloadingSpinner = nanospinner_1.default.createSpinner('Downloading file...').start();
                const fileContent = yield fakeyou_1.default.downloadFile(audioEndpoint);
                downloadingSpinner.success({ text: 'Download complete' });
                resolve(fileContent);
                return;
            }
            else if (status === 'complete_failure' || status === 'dead') {
                clearInterval(timer);
                waitingSpinner.error({ text: 'Your audio file couldn\'t be processed' });
            }
            waitingSpinner.update({ text: availabilityText(elapsedSeconds) });
        }), FETCH_INTERVAL);
    });
}
function confirmSaveFile() {
    return __awaiter(this, void 0, void 0, function* () {
        const answers = yield inquirer_1.default.prompt({
            type: 'confirm',
            name: 'confirmSaveFile',
            message: 'Save file?'
        });
        return answers.confirmSaveFile;
    });
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        welcome();
        const categoryToken = yield askVoiceCategory();
        const voiceToken = yield askVoiceModel(categoryToken);
        if (voiceToken === NO_OPTION.value) {
            return;
        }
        const text = yield askText();
        const spinner = nanospinner_1.default.createSpinner('Queuing your TTS...').start();
        const { success: quequeSuccess, idempotencyToken, jobToken } = yield fakeyou_1.default.requestTTS(voiceToken, text);
        if (!quequeSuccess) {
            spinner.error({ text: 'Couldn\'t queue your TSS request' });
            return;
        }
        spinner.success({ text: 'Your TTS request was queued' });
        const fileContent = yield downloadAudio(jobToken);
        if (!fileContent)
            return;
        const savefile = yield confirmSaveFile();
        if (!savefile)
            return;
        const filepath = path_1.default.join(os_1.default.homedir(), `vocodes_${idempotencyToken}.wav`);
        fs_1.default.writeFileSync(filepath, fileContent, { encoding: 'binary' });
        console.log(gradient_string_1.default.cristal.multiline(`\nYour audio file has been saved successfully!\n${filepath}\n`));
    });
}
;
void (init());
