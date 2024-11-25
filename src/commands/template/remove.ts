import fs from 'node:fs';
import path from 'node:path';
import { SfCommand, Flags } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { error } from '@oclif/core/errors';
import chalk from 'chalk';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('smocker-concretio', 'template.remove');

export type TemplateRemoveResult = {
  path: string;
};

export type templateSchema = {
  'template-file-name': string;
  'namespace-to-exclude': string[];
  'output-format': string[];
  language: string;
  count: number;
  sobjects: Array<{ [key: string]: typeSObjectSettingsMap }>;
};

type typeSObjectSettingsMap = {
  'fields-to-exclude'?: string[];
  count?: number;
  language?: string;
};

function deleteSObjectField(jsonData: templateSchema, sObjectName: string, fieldName: string): templateSchema {
  const sObject = jsonData.sobjects.find((obj) => Object.prototype.hasOwnProperty.call(obj, sObjectName)) as {
    [key: string]: typeSObjectSettingsMap;
  };

  if (sObject?.[sObjectName]) {
    if (Object.prototype.hasOwnProperty.call(sObject[sObjectName], fieldName)) {
      console.log(`Removing ${fieldName} from the sobject ${sObjectName} settings.`);
      delete sObject[sObjectName][fieldName as keyof typeSObjectSettingsMap];
    } else {
      throw new Error(`The specified flag '${fieldName}' does not exist in the '${sObjectName}' sObject.`);
    }
  } else {
    throw error(`'The '${sObjectName}' does not exist in the sobjects settings.`);
  }
  return jsonData;
}

function DeletesObject(jsonData: templateSchema, sObjectNames: string[]): templateSchema {
  sObjectNames.map((sObjectName) => {
    const sObjectIndex = jsonData.sobjects.findIndex((obj) =>
      Object.prototype.hasOwnProperty.call(obj, sObjectName.toLocaleLowerCase())
    );

    if (sObjectIndex === -1) {
      throw new Error(`The specified sObject '${sObjectName}' does not exist in the data template file.`);
    }

    jsonData.sobjects.splice(sObjectIndex, 1);
  });

  console.log(chalk.green(`Object '${sObjectNames.join(', ')}' has been removed from the data template file.`));

  return jsonData;
}

function parseInput(input: string[]): string[] {
  return input
    .join('')
    .split(/[\s,]+/)
    .filter((item) => item.length > 0);
}

function DeleteArrayValue(
  jsonData: templateSchema,
  fieldName: keyof templateSchema,
  fieldValues: string[]
): templateSchema {
  const updatedJsonData = { ...jsonData };

  if (fieldName === 'namespace-to-exclude' || fieldName === 'output-format') {
    if (Object.prototype.hasOwnProperty.call(jsonData, fieldName)) {
      const myArray: string[] = jsonData[fieldName];

      const valuesNotInJSON: string[] = fieldValues.filter(
        (item) => !myArray.map((str) => str.toLowerCase()).includes(item.toLowerCase())
      );
      if (valuesNotInJSON.length > 0) {
        throw new Error(`Values '${valuesNotInJSON.join(', ')}' do not exist in the ${fieldName}. `);
      }
      if (Array.isArray(myArray)) {
        const updatedArray: string[] = myArray.filter(
          (item): item is string =>
            typeof item === 'string' && !fieldValues.map((value) => value.toLowerCase()).includes(item.toLowerCase())
        );

        updatedJsonData[fieldName] = updatedArray;

        if (fieldName === 'output-format' && updatedArray.length === 0) {
          throw new Error(
            "Error: All the values from 'output-format' cannot be deleted! You must leave at least one value."
          );
        }

        console.log(`Removing '${fieldValues.join(', ')}' from the ${fieldName}.`);
      }
    } else {
      throw error(`${fieldName} does not exist in the data template.`);
    }
  }
  return updatedJsonData;
}

function DeleteSObjectArrayValue(jsonData: templateSchema, sObjectName: string, fieldValues: string[]): templateSchema {
  const concernedObject = jsonData.sobjects.find((obj) => Object.prototype.hasOwnProperty.call(obj, sObjectName));
  if (!concernedObject) {
    throw new Error(`The specified sObject '${sObjectName}' does not exist in the data template file.`);
  }
  if (concernedObject) {
    const existingValues = concernedObject[sObjectName]?.['fields-to-exclude'];
    if (existingValues !== undefined) {
      const valuesNotInJSON: string[] = fieldValues.filter(
        (item) => !existingValues.map((val) => val.toLowerCase()).includes(item.toLowerCase())
      );
      if (valuesNotInJSON.length > 0) {
        throw new Error(
          `Values '${valuesNotInJSON.join(
            ', '
          )}' do not exist in the 'fields-to-exclude' of sobject '${sObjectName}' settings `
        );
      }
      const updatedArray = existingValues.filter(
        (item) => !fieldValues.map((val) => val.toLowerCase()).includes(item.toLowerCase())
      );
      console.log(
        `Removing '${existingValues.join(', ')}' from the 'fields-to-exclude' of sobject '${sObjectName}' settings.`
      );
      concernedObject[sObjectName]['fields-to-exclude'] = updatedArray;
    } else {
      throw new Error(`The 'fields-to-exclude' does not exist for sobject '${sObjectName}' settings.`);
    }
  }
  return jsonData;
}

export default class TemplateRemove extends SfCommand<TemplateRemoveResult> {
  public static readonly summary: string = messages.getMessage('summary');

  public static readonly examples: string[] = [messages.getMessage('Examples')];

  public static readonly flags = {
    'template-name': Flags.string({
      summary: messages.getMessage('flags.template-name.summary'),
      description: messages.getMessage('flags.template-name.description'),
      char: 't',
      required: true,
    }),
    sobject: Flags.string({
      summary: messages.getMessage('flags.sobject.summary'),
      description: messages.getMessage('flags.sobject.description'),
      char: 's',
    }),
    language: Flags.boolean({
      summary: messages.getMessage('flags.language.summary'),
      description: messages.getMessage('flags.language.description'),
      char: 'l',
    }),
    count: Flags.boolean({
      summary: messages.getMessage('flags.count.summary'),
      description: messages.getMessage('flags.count.description'),
      char: 'c',
    }),
    'namespace-to-exclude': Flags.string({
      summary: messages.getMessage('flags.namespace-to-exclude.summary'),
      description: messages.getMessage('flags.namespace-to-exclude.description'),
      char: 'x',
      multiple: true,
    }),
    'output-format': Flags.string({
      summary: messages.getMessage('flags.output-format.summary'),
      description: messages.getMessage('flags.output-format.description'),
      char: 'f',
      multiple: true,
    }),
    'fields-to-exclude': Flags.string({
      summary: messages.getMessage('flags.fields-to-exclude.summary'),
      description: messages.getMessage('flags.fields-to-exclude.description'),
      char: 'e',
      multiple: true,
    }),
  };

  public async run(): Promise<TemplateRemoveResult> {
    const { flags } = await this.parse(TemplateRemove);
    const flagKeys = Object.keys(flags);

    const templateName = flags['template-name'];
    const filename = templateName.endsWith('.json') ? templateName : `${templateName}.json`;
    if (!filename) {
      this.error('Error: You must specify a filename using the --template-name flag.');
    }
    const templateDirPath = path.join(process.cwd(), 'data_gen/templates');
    if (!fs.existsSync(templateDirPath)) {
      this.error(`Template directory does not exist at ${templateDirPath}. Please initialize the setup first.`);
    }
    const configFilePath = path.join(templateDirPath, filename);
    if (!fs.existsSync(configFilePath)) {
      this.error(`Data Template file not found at ${configFilePath}`);
    }

    let jsonData = JSON.parse(fs.readFileSync(configFilePath, 'utf8')) as templateSchema;

    if (flagKeys.length === 1 && flagKeys.includes('template-name')) {
      this.error('Error: Data Template File cannot be deleted! You must specify at least one setting flag to remove');
    }

    if (!flags.sobject) {
      if (flags['fields-to-exclude'] !== undefined || flags.count || flags.language) {
        const errorMessage = flags.count
          ? 'Default count can not be deleted! You can update instead.'
          : 'Default language can not be deleted! You can update instead.';

        throw new Error(errorMessage);
      }
      if (flags['namespace-to-exclude']) {
        jsonData = DeleteArrayValue(jsonData, 'namespace-to-exclude', parseInput(flags['namespace-to-exclude']));
      }
      if (flags['output-format']) {
        jsonData = DeleteArrayValue(jsonData, 'output-format', parseInput(flags['output-format']));
      }
    } else {
      if (flags['namespace-to-exclude'] !== undefined || flags['output-format'] !== undefined) {
        const errorMessage = flags['namespace-to-exclude']
          ? 'You cannot use global flag "namespace-to-exclude" with an SObject flag.'
          : 'You cannot use global flag "output-format" with an SObject flag.';

        throw new Error(errorMessage);
      }

      const sObject = flags.sobject;
      if (flags.count) {
        jsonData = deleteSObjectField(jsonData, sObject, 'count');
      }
      if (flags.language) {
        jsonData = deleteSObjectField(jsonData, sObject, 'language');
      }
      if (flags['fields-to-exclude']) {
        jsonData = DeleteSObjectArrayValue(jsonData, sObject, parseInput(flags['fields-to-exclude']));
      }
      if (!flags.count && !flags.language && !flags['fields-to-exclude']) {
        const sObjectNames = parseInput([sObject]);
        jsonData = DeletesObject(jsonData, sObjectNames);
      }
    }
    fs.writeFileSync(configFilePath, JSON.stringify(jsonData, null, 2), 'utf8');
    this.log(chalk.green(`Success: Configuration updated in data template file ${configFilePath}`));

    return {
      path: 'src/commands/template/remove.ts',
    };
  }
}
