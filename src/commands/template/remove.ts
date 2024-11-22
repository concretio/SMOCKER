/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable sf-plugin/dash-o */
/* eslint-disable sf-plugin/flag-case */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import fs from 'node:fs';
import path from 'node:path';
import { Messages } from '@salesforce/core';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import chalk from 'chalk';
import { SObjectItem, templateSchema, FlagsType } from '../../utils/types.js';
import { arrayFlags } from '../../utils/constants.js';
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('smocker-concretio', 'template.remove');

// type typeSObjectSettingsMap = {
//   'fields-to-exclude'?: string[];
//   count?: number;
//   language?: string;
// };

// type SObjectItem = { [key: string]: typeSObjectSettingsMap };

// type templateSchema = {
//   'template-file-name': string;
//   'namespace-to-exclude': string[];
//   'output-format': string[];
//   language: string;
//   count: number;
//   sobjects: SObjectItem[];
// };

// type FlagsType = {
//   sobject?: string;
//   'template-name': string;
//   language?: boolean;
//   count?: boolean;
//   'namespace-to-exclude'?: string;
//   'output-format'?: string;
//   'fields-to-exclude'?: string;
// };

/* 
Removing specified configuration options from the given configObject based on provided flags.
*/
export function removeOrDeleteConfig(
  configMap: any,
  flags: FlagsType,
  allowedFlags: string[],
  log: (message: string) => void
): void {
  // const arrayFlags = ['namespace-to-exclude', 'output-format', 'fields-to-exclude'];

  for (const [key , value] of Object.entries(flags)) {
    if (allowedFlags.includes(key) && value !== undefined) {
      if (arrayFlags.includes(key) && typeof value === 'string') {
        const valuesArray = value
          .toLowerCase()
          .split(/[\s,]+/)
          .filter(Boolean);

        if (Array.isArray(configMap[key])) {
          const notFoundValues: string[] = [];
          const foundValues: string[] = [];

          valuesArray.forEach((item) => {
            const index = configMap[key].indexOf(item);
            if (index > -1) {
              foundValues.push(item);
              configMap[key].splice(index, 1);
            } else {
              notFoundValues.push(item);
            }
          });

          if (notFoundValues.length > 0) {
            if (flags.sobject) {
              throw new Error(`${notFoundValues.join(', ')} is not found in ${key} object "${flags.sobject}" settings`);
            } else {
              throw new Error(`${notFoundValues.join(', ')} is not found in ${key}`);
            }
          }

          if (key === 'output-format') {
            if (configMap[key].length === 0) {
              throw new Error(
                "Error: All the values from 'output-format' cannot be deleted! You must leave at least one value."
              );
            }

            if (valuesArray.length === 0) {
              throw new Error("Error: The '-f' (output-format) flag cannot be empty or contain only invalid values.");
            }
          }

          if (foundValues.length > 0) {
            if (flags.sobject) {
              log(`Removing:'${foundValues.join(', ')}' from '${key}' object "${flags.sobject}" settings `);
            } else {
              log(`Removing:'${foundValues.join(', ')}' from '${key}'`);
            }
          }
        }
      } else {
        delete configMap[key];
        log(`Removing: ${key} from the "${flags.sobject}" settings`);
      }
    } else if (key !== 'template-name' && key !== 'sobject') {
      throw new Error(`Error: Default ${key} can not be deleted! You can update instead.`);
    }
  }
}

export default class TemplateRemove extends SfCommand<void> {
  public static readonly summary: string = messages.getMessage('summary');

  public static readonly examples: string[] = [messages.getMessage('Examples')];

  public static readonly templateAddFlags = {
    sobject: Flags.string({
      char: 'o',
      summary: messages.getMessage('flags.sobject.summary'),
      required: false,
    }),
    'template-name': Flags.string({
      char: 't',
      summary: messages.getMessage('flags.template-name.summary'),
      required: true,
    }),
    language: Flags.boolean({
      char: 'l',
      summary: messages.getMessage('flags.language.summary'),
      required: false,
    }),
    count: Flags.boolean({
      char: 'c',
      summary: messages.getMessage('flags.count.summary'),
      required: false,
    }),
    'namespace-to-exclude': Flags.string({
      char: 'x',
      summary: messages.getMessage('flags.namespace-to-exclude.summary'),
      required: false,
    }),
    'output-format': Flags.string({
      char: 'f',
      summary: messages.getMessage('flags.output-format.summary'),
      required: false,
    }),
    'fields-to-exclude': Flags.string({
      char: 'e',
      summary: messages.getMessage('flags.fields-to-exclude.summary'),
      required: false,
    }),
  };

  public static readonly flags = TemplateRemove.templateAddFlags;

  public async run(): Promise<void> {
    const { flags } = await this.parse(TemplateRemove);

    const flagKeys = Object.keys(flags);

    const filename = flags['template-name'].includes('.json') ? flags['template-name'] : flags['template-name'] + '.json';

    const currWorkingDir = process.cwd();
    const dataGenDirPath = path.join(currWorkingDir, 'data_gen');
    const templateDirPath = path.join(dataGenDirPath, 'templates');

    if (!fs.existsSync(templateDirPath)) {
      this.error(`Template directory does not exist at ${templateDirPath}. Please initialize the setup first.`);
    }

    if (!filename) {
      this.error('Error: You must specify a filename using the --templateName flag.');
    }

    const configFilePath = path.join(templateDirPath, filename);

    if (!fs.existsSync(configFilePath)) {
      this.error(`Data Template file not found at ${configFilePath}`);
    }

    const config: templateSchema = JSON.parse(fs.readFileSync(configFilePath, 'utf8')) as templateSchema;

    if (flagKeys.length === 1 && flagKeys.includes('templateName')) {
      this.error('Error: Data Template File can not be deleted! You must specify at least one setting flag to remove');
    }

    const objectNames = flags.sobject ? flags.sobject.split(',').map((obj) => obj.trim().toLowerCase()) : undefined;

    let allowedFlags: string[] = [];
    let configFile: any = {};

    /*
    Handling object level configuration
    */
    if (objectNames) {
      if (flags['namespace-to-exclude']) {
        throw new Error('You cannot use global flag "namespace-to-exclude" with an SObject flag.');
      }

      if (flags['output-format']) {
        throw new Error('You cannot use global flag "output-format" with an SObject flag.');
      }

      if (!Array.isArray(config.sobjects)) {
        throw new Error("The 'sobjects' configuration is missing in the template data file.");
      }

      objectNames.forEach((objectName) => {
        const lowerCaseObjectName = objectName.toLowerCase();

        const objectIndex = config.sobjects.findIndex((obj: SObjectItem): boolean => {
          const keys = Object.keys(obj);
          return keys.length > 0 && keys[0].toLowerCase() === lowerCaseObjectName;
        });

        if (objectIndex === -1) {
          this.error(chalk.yellow(`Object '${objectName}' does not exist in data template file.`));
        } else {
          allowedFlags = ['fields-to-exclude', 'language', 'count'];

          if (flagKeys.includes('sobject') && Object.keys(flags).length === 2) {
            config.sobjects.splice(objectIndex, 1);
            this.log(chalk.green(`Object '${objectName}' has been removed from the data template file.`));
          }

          // If flags are provided, modify the object configuration
          else {
            const objectConfig = config.sobjects[objectIndex];
            const currentObjectName = Object.keys(objectConfig)[0];
            configFile = objectConfig[currentObjectName];

            const missingFlags: string[] = [];

            // Check each flag and dynamically collect missing or invalid flags
            if (flags.count && !configFile.count) {
              missingFlags.push('-c (count)');
            }
            if (flags.language && !configFile.language) {
              missingFlags.push('-l (language)');
            }

            if (flags['fields-to-exclude']) {
              const fieldsArray = flags['fields-to-exclude']
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);

              if (fieldsArray.length === 0) {
                this.error("Error: The '-e' (fields-to-exclude) flag cannot be empty or contain only invalid values.");
              }

              if (!configFile['fields-to-exclude']) {
                missingFlags.push('-e (fields-to-exclude)');
              }
            }

            if (missingFlags.length > 0) {
              this.error(
                `Error: Can not remove '${missingFlags.join(
                  ', '
                )}.' as it does not exist on ${currentObjectName} settings.`
              );
            }
          }
        }
      });
    } else {
      /*
      Handling object level configuration
      */
      if (flags['namespace-to-exclude']) {
        const fieldsArray = flags['namespace-to-exclude']
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
        if (fieldsArray.length === 0) {
          this.error("Error: The '-e' (namespace-to-exclude) flag cannot be empty or contain only invalid values.");
        }
      }

      if (flags['fields-to-exclude']) {
        if (!flags.sobject) {
          this.error("Error: The '-e' (fields-to-exclude) flag requires the '-o' (sobject) flag.");
        }
      }
      configFile = config;
      allowedFlags = ['output-format', 'namespace-to-exclude'];
    }

    // Call a function to remove/delete the configuration
    removeOrDeleteConfig(configFile, flags, allowedFlags, this.log.bind(this));

    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');

    this.log(chalk.green('Success: Configuration updated in data template file'));
  }
}
