/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import fs from 'node:fs';
import path from 'node:path';

import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import chalk from 'chalk';
import { askQuestion } from './init.js';
// import { validateConfigJson, getConnectionWithSalesforce } from '../template/validate.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('smocker-concretio', 'template.add');

export type TemplateAddResult = {
  path: string;
};

type typeSObjectSettingsMap = {
  'fields-to-exclude'?: string[];
  count?: number;
  language?: string;
};

type SObjectItem = { [key: string]: typeSObjectSettingsMap };

type templateSchema = {
  'template-file-name': string;
  'namespace-to-exclude': string[];
  'output-format': string[];
  language: string;
  count: number;
  sobjects: SObjectItem[];
};

type tempAddFlags = {
  sobject?: string;
  'template-name': string;
  language?: string;
  count?: number;
  'namespace-to-exclude'?: string;
  'output-format'?: string;
  'fields-to-exclude'?: string;
};

export function updateOrInitializeConfig(
  configObject: any,
  flags: tempAddFlags,
  allowedFlags: string[],
  log: (message: string) => void
): void {
  const updatedConfig = { ...configObject };

  const arrayFlags = ['namespace-to-exclude', 'output-format', 'fields-to-exclude'];

  for (const [key, value] of Object.entries(flags)) {
    if (allowedFlags.includes(key) && value !== undefined) {
      // Checking if values need to be converted to an string[]
      if (arrayFlags.includes(key) && typeof value === 'string') {
        const valuesArray = value
          .toLowerCase()
          .split(/[\s,]+/)
          .filter(Boolean);
        // Push to array if it exists else assign to new
        if (key === 'output-format') {
          if (!valuesArray.every((format) => ['csv', 'json', 'di'].includes(format))) {
            throw new Error(chalk.red('Invalid output format passed. supports `csv`, `json` and `di` only'));
          } else if (
            valuesArray.includes('di') &&
            (updatedConfig['count'] > 200 ||
              updatedConfig['sobjects'].some(
                (obj: { [x: string]: { count: number } }) => obj[Object.keys(obj)[0]]?.count > 200
              ))
          ) {
            throw new Error(
              chalk.red('All count values should be within 1-200 to add DI-Direct Insertion in template')
            );
          }
        }

        if (Array.isArray(configObject[key])) {
          valuesArray.forEach((item: string) => {
            if (item && !configObject[key].includes(item)) {
              updatedConfig[key].push(item);
            }
          });
        } else {
          updatedConfig[key] = valuesArray;
        }

        log(`Updated '${key}' to: ${configObject[key].join(', ')}`);
      } else {
        if (key === 'language' && value !== 'en' && value !== 'jp') {
          throw new Error('Invalid language input. supports `en` or `jp` only');
        }

        if (
          key === 'count' &&
          ((value as number) < 1 || (value as number) > 200) &&
          config['output-format'].includes('di')
        ) {
          throw new Error('Invalid input. Please enter between 1-200');
        }

        updatedConfig[key] = value;
        log(`Setting '${key}' to: ${configObject[key]}`);
      }
    } else if (!['sobject', 'template-name'].includes(key)) {
      throw new Error(`Skipped: '${key}' flag can not be passed in the current command`);
    }
  }
}
export const templateAddFlags = {
  sobject: Flags.string({
    char: 's',
    summary: messages.getMessage('flags.sobject.summary'),
    description: messages.getMessage('flags.sobject.description'),
    required: false,
  }),
  'template-name': Flags.string({
    char: 't',
    summary: messages.getMessage('flags.template-name.summary'),
    description: messages.getMessage('flags.template-name.description'),
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
  'namespace-to-exclude': Flags.string({
    char: 'x',
    summary: messages.getMessage('flags.namespace-to-exclude.summary'),
    description: messages.getMessage('flags.namespace-to-exclude.description'),
    required: false,
  }),
  'output-format': Flags.string({
    char: 'f',
    summary: messages.getMessage('flags.output-format.summary'),
    description: messages.getMessage('flags.output-format.description'),
    required: false,
  }),
  'fields-to-exclude': Flags.string({
    char: 'e',
    summary: messages.getMessage('flags.fields-to-exclude.summary'),
    description: messages.getMessage('flags.fields-to-exclude.description'),
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

    let filename = flags['template-name'];
    if (!filename) {
      this.error('Error: You must specify a filename using the --templateName flag.');
    } else if (!filename.endsWith('.json')) {
      filename += '.json';
    }

    const objectName = flags.sobject ? flags.sobject.toLowerCase() : undefined;

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
        if (!Array.isArray(config.sobjects)) {
          config.sobjects = [];
        }
        let objectConfig = config.sobjects.find(
          (obj: SObjectItem): boolean => Object.keys(obj)[0] === objectName
        ) as SObjectItem;
        if (!objectConfig) {
          const addToTemplate = await askQuestion(
            chalk.yellow(`'${objectName}' does not exists in data template! Do you want to add?`) + chalk.dim('(Y/n)')
          );
          if (addToTemplate.toLowerCase() === 'yes' || addToTemplate.toLowerCase() === 'y') {
            objectConfig = { [objectName]: {} };
            config.sobjects.push(objectConfig);
          } else {
            return;
          }
        }
        const configFileForSobject: typeSObjectSettingsMap = objectConfig[objectName];
        allowedFlags = ['fields-to-exclude', 'language', 'count'];
        updateOrInitializeConfig(configFileForSobject, flags, allowedFlags, this.log.bind(this));
      } else {
        const configFile: templateSchema = config;
        allowedFlags = ['output-format', 'namespace-to-exclude', 'language', 'count'];
        updateOrInitializeConfig(configFile, flags, allowedFlags, this.log.bind(this));
      }

      // updateOrInitializeConfig(configFile, flags, allowedFlags, this.log.bind(this));
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
      // const connection = await getConnectionWithSalesforce();
      // await validateConfigJson(connection, configFilePath);
      this.log(chalk.green(`Success: Configuration updated in ${configFilePath}`));
    } catch (error) {
      this.error(`Process halted: ${(error as Error).message}`);
    }
  }
}
