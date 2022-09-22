#!/usr/bin/env node

import os from 'os';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import figlet from 'figlet';
import gradient from 'gradient-string';
import nanospinner from 'nanospinner';
import fakeyou from './api/fakeyou';

const pkg = require('./../package.json');
const CLI_VERSION = pkg.version;
const FETCH_INTERVAL = 1_000; // 1 seconds

const NO_OPTION = {
    name: '(Quit)',
    value: 'None'
};

function welcome() {
    const title = figlet.textSync('FakeYou').replace(/\s*\n\s*$/, ` ${CLI_VERSION}\n`);
    const description = 'Use Fake You deep fake technology to say things with your favorite characters\n';
    console.log(gradient.passion.multiline(title));
    console.log(gradient.passion.multiline(description));
}

async function askVoiceCategory(): Promise<string> {
    const { categories } = await fakeyou.getCategoryList();
    const filteredCategories = categories.filter((category) => !category.haveSuperCategory && category.name);
    const answers = await inquirer.prompt({
        type: 'list',
        name: 'voice_category',
        message: `Select a voice category (${filteredCategories.length})`,
        choices: filteredCategories.map((category) => ({
            name: category.name,
            value: category.token
        }))
    });

    return answers.voice_category;
}

async function askVoiceModel(categoryToken: string): Promise<string> {
    const { voices } = await fakeyou.getVoiceList();
    const filteredVoices = voices.filter((voice) => voice.categoryTokens.includes(categoryToken) && voice.name);
    const choices = filteredVoices.map((voice) => ({
        name: voice.name,
        value: voice.token
    }));
    choices.push(NO_OPTION);

    const answers = await inquirer.prompt({
        type: 'list',
        name: 'voice_model',
        message: `Select a voice model (${filteredVoices.length})`,
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

    const categoryToken = await askVoiceCategory();
    const voiceToken = await askVoiceModel(categoryToken);

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
