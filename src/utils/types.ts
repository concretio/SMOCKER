/* eslint-disable @typescript-eslint/member-ordering */
export type TargetData = {
    name: string;
    type: string;
    min?: number;
    max?: number;
    decimals?: number;
    values?: string[];
};

export type GenericRecord = { [key: string]: unknown };

export type CreateResult = { id: string; success: boolean; errors: unknown[] };

export type fieldType =
| 'text'
| 'boolean'
| 'phone'
| 'currency'
| 'double'
| 'date'
| 'time'
| 'datetime'
| 'picklist'
| 'reference'
| 'dependent-picklist'
| 'email'
| 'address';

export type SObjectConfig = {
    sObject: string;
    language: string;
    count?: number;
    fields?: { [key: string]: Types.Field };
  };
  
 export  type SObjectConfigFile = {
    sObjects: SObjectConfig[];
  };
  
// types for init.ts

export type SetupInitResult = {
    'template-file-name': string;
    'namespace-to-exclude': string[];
    'output-format': string[];
    language: string;
    count: number;
    sobjects: Array<{ [key: string]: typeSObjectSettingsMap }>;
  };
  
export type typeSObjectSettingsMap = {
    'fields-to-exclude'?: string[];
    count?: number;
    language?: string;
};
  
// types for add.ts file
export type TemplateAddResult = {
    path: string;
  };
  

export type SObjectItem = { [key: string]: typeSObjectSettingsMap };
  
export  type templateSchema = {
    'template-file-name': string;
    'namespace-to-exclude': string[];
    'output-format': string[];
    language: string;
    count: number;
    sobjects: SObjectItem[];
};
  
// types from remove.ts file 
export type FlagsType = {
    sobject?: string;
    'template-name': string;
    language?: boolean;
    count?: boolean;
    'namespace-to-exclude'?: string;
    'output-format'?: string;
    'fields-to-exclude'?: string;
};
  
// types for validate.ts results   
export type TemplateValidateResult = {
    path: string;
};
export namespace Types {
    export type Field = {
      fullName: string | null | undefined;
    };
  }
export type sObjectMetaType = {
    nameField?: { label: string; type: string };
    fields?: Types.Field[];
};
  
export   type sObjectSchemaType = {
      'fields-to-exclude'?: string[];
      count?: number;
      language?: string;
};
      
export namespace FieldData {
    export type Field = {
      type: string;
      values?: string[];
      referenceTo?: string;
      relationshipType?: 'lookup' | 'master-detail';
      'child-dependent-field'?: string;
      [key: string]: unknown;
    };
}
