/* eslint-disable sf-plugin/flag-case */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { SfCommand, Flags, Spinner } from '@salesforce/sf-plugins-core';
import { Messages, Connection, AuthInfo } from '@salesforce/core';
import chalk from 'chalk';
import {
  TemplateValidateResult,
  sObjectSchemaType,
  templateSchema,
  sObjectMetaType,
  Types,
} from '../../utils/types.js';
Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('smocker-concretio', 'template.validate');
dotenv.config();
export async function connectToSalesforceOrg(userNameorAlias: string): Promise<Connection> {
  try {
    const allAuths = await AuthInfo.listAllAuthorizations();
    const matchingAuths = allAuths.filter(
      (auth) => auth.username === userNameorAlias || (auth.aliases && auth.aliases.includes(userNameorAlias))
    );
    const resolvedUsername = matchingAuths[0].username;
    if (matchingAuths.length === 0) {
      throw new Error(`The input "${userNameorAlias}" does not match any authenticated username or alias.`);
    }
    const authInfo = await AuthInfo.create({ username: resolvedUsername });
    const connection = await Connection.create({ authInfo });
    console.log(chalk.green(`Success: Connected to SF Org: ${resolvedUsername}`));
    return connection;
  } catch (error) {
    throw new Error(
      chalk.red(
        `Failed: Connect to SF Org: ${chalk.redBright(
          userNameorAlias
        )} \n Either provide valid username/alias or authenticate your org using ${chalk.yellowBright(
          "'sf org login web'"
        )}`
      )
    );
  }
}

export async function validateConfigJson(connection: Connection, configPath: string): Promise<void> {
    const spinner = new Spinner(true);

    spinner.start('Please wait!! while we validate Objects and Fields');
    const config: templateSchema = JSON.parse(fs.readFileSync(configPath, 'utf8')) as templateSchema;    

    const invalidObjects: string[] = [];
    const invalidFieldsMap: { [key: string]: string[] } = {};

    const sObjectNames: string[] = config.sObjects.map(
      (sObjectEntry: sObjectSchemaType) => Object.keys(sObjectEntry)[0]
    );

    const metadata = await connection.metadata.read('CustomObject', sObjectNames);
    const metadataArray = Array.isArray(metadata) ? metadata : [metadata];

    for (const sObjectEntry of config.sObjects) {

      const [sObjectName, sObjectData] = Object.entries(sObjectEntry)[0] as [string, sObjectSchemaType];
      const sObjectMeta = metadataArray.find((meta) => meta.fullName === sObjectName) as sObjectMetaType;

      if (!sObjectMeta) {
        invalidObjects.push(sObjectName);
        continue;
      }

      const fieldsToExclude = sObjectData['fieldsToExclude'] ?? [];
      const fieldsToConsider = sObjectData['fieldsToConsider'] ?? {};         
      
      if (sObjectData['pickLeftFields'] === false && Object.keys(fieldsToConsider).length === 0) {
        throw new Error(
          chalk.yellow(
            `Warning: [${sObjectName}] No fields are found to generate data. Make sure to set 'pick-left-fields' to 'true' or add fields to 'fields-to-consider'`
          )
        );
      }
      
      const getAllFields: string[] = sObjectMeta.fields
        ? sObjectMeta.fields
            .filter((field: Types.Field) => field.fullName != null)
            .map((field: Types.Field) => field.fullName!.toLowerCase())
        : [];

      /*
      handling the name field for the custom object
      */
      if (sObjectMeta.nameField) {
        getAllFields.push('name');
      }

      const invalidFieldsInConisder = Object.keys(fieldsToConsider).filter((field) => {
        // checking for dependent picklist fields(dp-) in the schema
        const fieldCheck = field.startsWith('dp-') ? field.substring(3) : field;
        return !getAllFields.includes(fieldCheck.toLowerCase());
      });

      const invalidFields = fieldsToExclude.filter((field: string) => !getAllFields.includes(field));

      const allInvalidFields = [...invalidFields, ...invalidFieldsInConisder];

      if (allInvalidFields.length > 0) {
        invalidFieldsMap[sObjectName] = allInvalidFields;
      }
    
      
    }
    spinner.stop('');
    if (invalidObjects.length > 0) {
      console.warn(
        chalk.magenta(`Warning: SObjects do not exist or cannot be accessed:\n -> ${invalidObjects.join(', ')}`)
      );
    }

    if (Object.keys(invalidFieldsMap).length > 0) {
      console.warn(chalk.magenta('Warning: Fields do not exist or cannot be accessed:'));
      for (const [sObjectName, fields] of Object.entries(invalidFieldsMap)) {
        setTimeout(() => fields, 5000);
        console.warn(chalk.magenta(` -> ${sObjectName}: ${fields.join(', ')}`));
      }
    }

    if (Object.keys(invalidFieldsMap).length > 0 || invalidObjects.length > 0) {
      console.warn(
        chalk.bold.magenta(
          'Note: Still we keep these populated these values, You can change them anytime from the data template!'
        )
      );
    } else {
      console.log(
        chalk.green(`Successfully validated '${path.basename(configPath)}' and no invalid object/fields were found!`)
      );
    }
}

export class TemplateValidate extends SfCommand<TemplateValidateResult> {
  public static readonly summary: string = messages.getMessage('summary');

  public static readonly examples: string[] = [messages.getMessage('Examples')];

  public static readonly flags = {
    templateName: Flags.string({
      summary: messages.getMessage('flags.templateName.summary'),
      description: messages.getMessage('flags.templateName.description'),
      char: 't',
      required: true,
    }),
    alias: Flags.string({
      summary: messages.getMessage('flags.alias.summary'),
      description: messages.getMessage('flags.alias.description'),
      char: 'a',
      required: true,
    }),
  };

  public async run(): Promise<TemplateValidateResult> {
    const { flags } = await this.parse(TemplateValidate);

    const currWorkingDir = process.cwd();
    const sanitizeFilename = flags['templateName'].endsWith('.json')
      ? flags['templateName']
      : flags['templateName'] + '.json';
    const templateDirPath = path.join(currWorkingDir, `data_gen/templates/${sanitizeFilename}`);
    const userNameOrAlias = flags.alias;
    if (fs.existsSync(templateDirPath)) {
      const connection = await connectToSalesforceOrg(userNameOrAlias);
      console.log(chalk.cyan('Success: SF Connection established.'));
      await validateConfigJson(connection, templateDirPath);
    } else {
      throw new Error(`File: ${flags['templateName']} is not present at this path: ${templateDirPath}`);
    }

    return {
      path: 'src/commands/template/validate.ts',
    };
  }
}
