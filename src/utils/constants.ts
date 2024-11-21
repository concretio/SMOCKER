export const arrayFlags = ['namespace-to-exclude', 'output-format', 'fields-to-exclude'];

export const languageChoices = [
    { name: 'en', message: 'en', value: 'en', hint: 'English (US)' },
    { name: 'jp', message: 'jp', value: 'jp', hint: 'Japanese' },
];
  
export const outputChoices = [
    { name: 'DI', message: 'DI', value: 'di', hint: 'Create records into org (limit- upto 200)' },
    { name: 'JSON', message: 'JSON', value: 'json' },
    { name: 'CSV', message: 'CSV', value: 'csv' },
];

export const MOCKAROO_BASE_URL = 'https://api.mockaroo.com/api/generate.json';