#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import nanospinner from 'nanospinner';
import fakeyou, { VoiceCategory } from './api/fakeyou';
import preferenceHelpers from './helpers/preferenceHelpers';
import categoryHelpers from './helpers/categoryHelpers';
import voiceHelpers from './helpers/voiceHelpers';

const FETCH_INTERVAL = 1_000; // 1 seconds

const NO_OPTION = {
    name: '(Quit)',
    value: 'None'
};

function welcome() {
    const title = figlet.textSync('FakeYou').replace(/\s*\n\s*$/, ` ${preferenceHelpers.getVersion()}\n`);
    const description = 'Use Fake You deep fake technology to say things with your favorite characters\n';
    console.log(gradient.passion.multiline(title));
    console.log(gradient.passion.multiline(description));
}

async function askVoiceCategory(): Promise<VoiceCategory> {
    const categories = await categoryHelpers.getCategoryList((category) => {
        return !category.haveSuperCategory && category.name.length > 0
    });
    const answers = await inquirer.prompt({
        type: 'list',
        name: 'voice_category',
        message: `Select a voice category (${categories.length})`,
        choices: categories.map((category) => ({
            name: category.name,
            value: category
        }))
    });

    return answers.voice_category;
}

async function askVoiceModel(category: VoiceCategory): Promise<string> {
    // Retrieve all sub categories
    // Cause we want all voices models that belongs to the root category or its sub categories, no matter the depth
    const categories = await categoryHelpers.getAllSubCategories(category);
    // Filter all categories by haveModels attribute, include root category because it can also have models
    const filteredCategories = categories.concat([category]).filter((cat) => cat.haveModels);
    const voices = await voiceHelpers.getVoiceListByCategories(filteredCategories, (voice) => {
        return voice.name.length > 0;
    });
    const choices = voices.map((voice) => ({
        name: voice.name,
        value: voice.token
    }));
    choices.push(NO_OPTION);

    const answers = await inquirer.prompt({
        type: 'list',
        name: 'voice_model',
        message: `Select a voice model (${voices.length})`,
        choices: choices
    });

    return answers.voice_model;
};

async function askText(): Promise<string> {
    const answers = await inquirer.prompt({
        type: 'input',
        name: 'text',
        message: 'Enter funny text',
        validate: (input: string) => {
            const trimmedInput = input.trim();
            if (trimmedInput.length === 0) return 'Required'
            else if (trimmedInput.length < 3) return 'At least 3 characters required'

            return true;
        }
    });

    return answers.text;
}

function downloadAudio(jobToken: string): Promise<Buffer | null> {
    const availabilityText = (seconds: number) => `Waiting for file availability... ⌛${seconds}s`;
    const waitingSpinner = nanospinner.createSpinner(availabilityText(0)).start();
    const startTime = Date.now();

    return new Promise((resolve) => {
        const timer = setInterval(async () => {
            const currentTime = Date.now(); 
            const elapsedMillis = currentTime - startTime;
            const elapsedSeconds = Math.floor(elapsedMillis / 1000);

            const {
                job: {
                    status,
                    audioEndpoint
                }
            } = await fakeyou.fetchTTSStatus(jobToken);
    
            if (status === 'complete_success') {
                clearInterval(timer);
                waitingSpinner.success({ text: 'Your audio file is available' });

                const downloadingSpinner = nanospinner.createSpinner('Downloading file...').start();
                const fileContent = await fakeyou.downloadFile(audioEndpoint);
                downloadingSpinner.success({ text: 'Download complete'});
                resolve(fileContent);

                return;
            } else if (status === 'complete_failure' || status === 'dead') {
                clearInterval(timer);
                waitingSpinner.error({ text: 'Your audio file couldn\'t be processed' });
            }

            waitingSpinner.update({ text: availabilityText(elapsedSeconds) });
        }, FETCH_INTERVAL);
    });
}

async function confirmSaveFile(): Promise<boolean> {
    const answers = await inquirer.prompt({
        type: 'confirm',
        name: 'confirmSaveFile',
        message: 'Save file?'
    });

    return answers.confirmSaveFile;
} 
 
async function init(): Promise<void> {
    welcome();

    const category = await askVoiceCategory();
    const voiceToken = await askVoiceModel(category);

    if (voiceToken === NO_OPTION.value) {
        return;
    }

    const text = await askText();

    const spinner = nanospinner.createSpinner('Queuing your TTS...').start();
    const { success: quequeSuccess, idempotencyToken, jobToken } = await fakeyou.requestTTS(voiceToken, text);
    
    if (!quequeSuccess) {
        spinner.error({ text: 'Couldn\'t queue your TSS request'});
        return;
    }

    spinner.success({ text: 'Your TTS request was queued'});

    const fileContent = await downloadAudio(jobToken);
    if (!fileContent) return;
    
    const savefile = await confirmSaveFile();
    if (!savefile) return;

    const filepath = path.join(os.homedir(), `vocodes_${idempotencyToken}.wav`);

    fs.writeFileSync(filepath, fileContent, { encoding: 'binary' });
    console.log(gradient.cristal.multiline(`\nYour audio file has been saved successfully!\n${filepath}\n`));
};

void(init());
