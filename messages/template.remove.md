# summary

This command removes specified values or configurations from the given properties of a data generation template.

# flags.template-name.summary

Specify the data template name.

# flags.template-name.description

Use `--templateName` or `-t` to specify the name of the data template to be utilized. The template must exist in the `data_gen/templates` directory.

# flags.count.summary

Remove the number of records specified for generation at the object level setting.

# flags.count.description

Use --count or -c to remove the record count. This can only be removed at the object level and not at the template level. If --sObject or -o is provided, it will remove the count setting for that specific object.

# flags.namespace-to-exclude.summary

Remove namespaces to exclude from record data generation.

# flags.namespace-to-exclude.description

Use --namespaceToExclude or -x to remove specific namespaces from being excluded during record data generation. Multiple namespaces can be specified, separated by commas. This setting applies only at the template level and cannot be defined for individual objects.

# flags.language.summary

Remove the specified the language to generate records. [supports 'en' or 'jp']

# flags.language.description

Use `--language` or `-l` to select the language ('en' or 'jp'). When `--sObject` or `-o` is specified, this will update or remove the language setting for that object.

# flags.output-format.summary

Removes the specified the output format(s) for generated data. [supports CSV, JSON, DI (direct insert to connected org)]

# flags.output-format.description

Use --outputFormat or -f to remove the specified output format(s). Multiple formats (CSV, JSON, DI) can be specified, separated by commas. At least one outputFormat must always be specified and cannot be completely removed.

# flags.sobject.summary

Specify the Object API name(s) to remove object-level settings.

# flags.sobject.description

Use --sObject or -o to target one or more objects and remove their existing settings. Multiple sObjects can be specified, separated by commas.

# flags.fields-to-exclude.summary

Remove fields excluded from test data generation.

# flags.fields-to-exclude.description

Use --fieldsToExclude or -e to remove the exclusion of specific fields for a given object.This setting applies only at the object level and cannot be defined at template level.

# Examples

- `sf template remove -t <template-name> <global flags -f[values],-x[values]>`
- `sf template remove -t <template-name> -o <object-name> <-e[values],-c,-l>`
