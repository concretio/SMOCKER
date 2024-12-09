/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */

import fs from 'node:fs';
import path from 'node:path';

import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import chalk from 'chalk';
import { askQuestion } from './init.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('smocker-concretio', 'template.upsert');

export type TemplateAddResult = {
  path: string;
};

type typeSObjectSettingsMap = {
  fieldsToExclude?: string[];
  fieldsToConsider?: fieldsToConsiderMap;
  count?: number;
  language?: string;
  pickLeftField?: boolean;
};

type SObjectItem = { [key: string]: typeSObjectSettingsMap };

type templateSchema = {
  templateFileName: string;
  namespaceToExclude: string[];
  outputFormat: string[];
  language: string;
  count: number;
  sObjects: SObjectItem[];
};
type tempAddFlags = {
  sObjects?: string;
  templateName: string;
  language?: string;
  count?: number;
  namespaceToExclude?: string;
  outputFormat?: string;
  fieldsToExclude?: string;
  fieldsToConsider?: string;
};

type fieldsToConsiderMap = {
  [key: string]: string[] | string;
};

export function handleFieldsToConsider(sObjectConfig: typeSObjectSettingsMap, input: string): typeSObjectSettingsMap {
  if (!sObjectConfig.fieldsToConsider) {
    sObjectConfig.fieldsToConsider = {};
  }

  const fieldsToConsider: fieldsToConsiderMap = {};

  const regex = /([\w-]+):\s*(\[[^\]]*\])|([\w-]+)/g;
  let match;
  while ((match = regex.exec(input)) !== null) {
    const key = match[1] || match[3];
    const value = match[2];
    if (key && value) {
      const fieldValues = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim());
      fieldsToConsider[key] = fieldValues;
    } else {
      fieldsToConsider[key] = [];
    }

    if (key.startsWith('dp-')) {
      if (value) {
        const dpfieldValue = value.slice(1, -1).trim();
        fieldsToConsider[key] = dpfieldValue;
      } else {
        fieldsToConsider[key] = '';
      }
    }
  }

  sObjectConfig.fieldsToConsider = { ...sObjectConfig.fieldsToConsider, ...fieldsToConsider };

  return sObjectConfig;
}

export function updateOrInitializeConfig(
  configObject: any,
  flags: tempAddFlags,
  allowedFlags: string[],
  log: (message: string) => void
): void {
  for (const [key, value] of Object.entries(flags)) {
    if (allowedFlags.includes(key) && value !== undefined) {
      switch (key) {
        case 'namespaceToExclude':
        case 'outputFormat':
        case 'fieldsToExclude':
          if (typeof value === 'string') {
            const valuesArray = value
              .toLowerCase()
              .split(/[\s,]+/)
              .filter(Boolean);
            if (key === 'outputFormat' && !valuesArray.every((format) => ['csv', 'json', 'di'].includes(format))) {
              throw new Error(chalk.red('Invalid output format passed. supports `csv`, `json` and `di` only'));
            }

            if (Array.isArray(configObject[key])) {
              valuesArray.forEach((item: string) => {
                if (item && !configObject[key].includes(item)) {
                  configObject[key].push(item);
                }
              });
            } else {
              configObject[key] = valuesArray;
            }
            log(`Updated '${key}' to: ${configObject[key].join(', ')}`);
          }
          break;

        case 'fieldsToConsider':
          if (typeof value === 'string') {
            const updatedConfig = handleFieldsToConsider(configObject, value);
            configObject.fieldsToConsider = updatedConfig.fieldsToConsider;
            log(`Updated 'fieldsToConsider' to: ${JSON.stringify(updatedConfig.fieldsToConsider)}`);
          }
          break;

        default:
          if (key === 'language' && value !== 'en' && value !== 'jp') {
            throw new Error('Invalid language input. supports `en` or `jp` only');
          }

          if (key === 'pickLeftFields') {
            console.log('14433334', configObject[key]);
            configObject[key] = false;

            // configObject[key] = !configObject[key];
            console.log('144444', configObject[key]);
          }
          configObject[key] = value;
          log(`Setting '${key}' to: ${configObject[key]}`);
          break;
      }
    } else if (!['sObject', 'templateName'].includes(key)) {
      log(chalk.yellow(`Skipped: '${key}' flag cannot be passed in the current command`));
    }
  }
}

export const templateAddFlags = {
  sObject: Flags.string({
    char: 's',
    summary: messages.getMessage('flags.sObject.summary'),
    description: messages.getMessage('flags.sObject.description'),
    required: false,
  }),
  templateName: Flags.string({
    char: 't',
    summary: messages.getMessage('flags.templateName.summary'),
    description: messages.getMessage('flags.templateName.description'),
    required: true,
  }),
  language: Flags.string({
    char: 'l',
    summary: messages.getMessage('flags.language.summary'),
    description: messages.getMessage('flags.language.description'),
    required: false,
  }),
  count: Flags.integer({
    char: 'c',
    summary: messages.getMessage('flags.count.summary'),
    description: messages.getMessage('flags.count.description'),
    required: false,
  }),
  namespaceToExclude: Flags.string({
    char: 'x',
    summary: messages.getMessage('flags.namespaceToExclude.summary'),
    description: messages.getMessage('flags.namespaceToExclude.description'),
    required: false,
  }),
  outputFormat: Flags.string({
    char: 'f',
    summary: messages.getMessage('flags.outputFormat.summary'),
    description: messages.getMessage('flags.outputFormat.description'),
    required: false,
  }),
  fieldsToExclude: Flags.string({
    char: 'e',
    summary: messages.getMessage('flags.fieldsToExclude.summary'),
    description: messages.getMessage('flags.fieldsToExclude.description'),
    required: false,
  }),
  fieldsToConsider: Flags.string({
    summary: messages.getMessage('flags.fieldsToConsider.summary'),
    description: messages.getMessage('flags.fieldsToConsider.description'),
    char: 'i',
    required: false,
  }),
  pickLeftFields: Flags.boolean({
    summary: messages.getMessage('flags.pickLeftFields.summary'),
    description: messages.getMessage('flags.pickLeftFields.description'),
    char: 'p',
    required: false,
  }),
};

let config: templateSchema;
export default class TemplateAdd extends SfCommand<void> {
  public static readonly summary: string = messages.getMessage('summary');

  public static readonly examples: string[] = [messages.getMessage('Examples')];

  public static readonly flags = templateAddFlags;

  public async run(): Promise<void> {
    const { flags } = await this.parse(TemplateAdd);

    let filename = flags.templateName;
    if (!filename) {
      this.error('Error: You must specify a filename using the --templateName flag.');
    } else if (!filename.endsWith('.json')) {
      filename += '.json';
    }

    const objectName = flags.sObject ? flags.sObject.toLowerCase() : undefined;

    try {
      // Variable Declarations and validatons
      const cwd = process.cwd();
      const dataGenDirPath = path.join(cwd, 'data_gen');

      const templateDirPath = path.join(dataGenDirPath, 'templates');
      if (!fs.existsSync(templateDirPath)) {
        this.error(`Template directory does not exist at ${templateDirPath}. Please initialize the setup first.`);
      }

      const configFilePath = path.join(templateDirPath, filename);
      if (!fs.existsSync(configFilePath)) {
        this.error(`Config file not found at ${configFilePath}`);
      }

      config = JSON.parse(fs.readFileSync(configFilePath, 'utf8')) as templateSchema;
      let allowedFlags = [];

      // Checking if Object Flag is passed or not

      if (objectName) {
        this.log(chalk.magenta.bold(`Working on the object level settings for ${objectName}`));
        if (!Array.isArray(config.sObjects)) {
          config.sObjects = [];
        }
        let objectConfig = config.sObjects.find(
          (obj: SObjectItem): boolean => Object.keys(obj)[0] === objectName
        ) as SObjectItem;
        if (!objectConfig) {
          const addToTemplate = await askQuestion(
            chalk.yellow(`'${objectName}' does not exists in data template! Do you want to add?`) + chalk.dim('(Y/n)')
          );
          if (addToTemplate.toLowerCase() === 'yes' || addToTemplate.toLowerCase() === 'y') {
            objectConfig = { [objectName]: {} };
            config.sObjects.push(objectConfig);
          } else {
            return;
          }
        }
        const configFileForSobject: typeSObjectSettingsMap = objectConfig[objectName];

        allowedFlags = ['fieldsToExclude', 'language', 'count', 'pickLeftFields', 'fieldsToConsider'];
        updateOrInitializeConfig(configFileForSobject, flags, allowedFlags, this.log.bind(this));
      } else {
        const configFile: templateSchema = config;
        allowedFlags = ['outputFormat', 'namespaceToExclude', 'language', 'count'];
        updateOrInitializeConfig(configFile, flags, allowedFlags, this.log.bind(this));
      }

      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
      this.log(chalk.green(`Success: Configuration updated in ${configFilePath}`));
    } catch (error) {
      this.error(`Process halted: ${(error as Error).message}`);
    }
  }
}
