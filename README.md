
# Smocker (v1.0.0)

**A Salesforce CLI Plugin to Simplify Synthetic Data Generation**

## Overview
Smocker is a lightweight yet powerful Salesforce CLI plugin that allows users to generate synthetic data quickly and easily. This tool is specifically designed to streamline the creation of realistic, customizable test data templates while ensuring compatibility with complex Salesforce schemas and industry-specific requirements.

---

## Installation

### Prerequisites
- **Salesforce CLI**
- **Node.js (v18.0.0 or later)**
- **Mockaroo API Key**

### Commands
1. **Install**:
   ```bash
   sf plugins install smocker-concretio
   ```
2. **Update**:
   ```bash
   sf plugins update
   ```
3. **Uninstall**:
   ```bash
   sf plugins uninstall smocker-concretio
   ```

---

## Directory Structure
The following directories are created when using Smocker:

- **data_gen**
  - **templates**: Stores data templates for test data generation.
  - **output**: Contains generated data and record insertion details.

---

## Environment Variables
Smocker relies on these environment variables:

```bash
SALESFORCE_USERNAME="username@domain.com"
SALESFORCE_SECURITY_TOKEN="your_security_token"
SALESFORCE_PASSWORD="your_password"
MOCKAROO_API_KEY="your_mockaroo_api_key"
```
> Obtain your Mockaroo API key from [Mockaroo](https://www.mockaroo.com/sign-up).

---

## Template Structure
Below is an example template:

```json
{
  "templateFileName": "default_data_template.json",
  "namespaceToExclude": [],
  "outputFormat": ["csv"],
  "language": "en",
  "count": 1,
  "sObjects": [
    { "account": {} },
    { "contact": {} },
    {
      "lead": {
        "fieldsToExclude": ["fax", "website"],
        "language": "en",
        "count": 5
      }
    }
  ]
}
```

---

## Smock-It Commands

1. **Initialize Template**: This command initializes a new data generation template. It sets up the required directory structure, prompts for a valid template file name, and collects configuration details for Salesforce objects (such as fields to exclude and record counts). The configuration is validated against org before it is saved to a JSON file.

   ```bash
   sf template init [--default]
   ```
2. **Upsert Configurations**: This command allows users to add or update configuration settings in an existing data template. Users can specify options like the Salesforce object, language, record count, fields to exclude, and other settings. 
If the object is not already present, the command will prompt users to add it.

   ```bash
   sf template upsert -t <templateFileName> [-s <sObject>] [-l <languageCode>] [-c <recordCount>] [-x <namespaceToExclude>] [-f <outputFormat>] [-e <fieldsToExclude>]
   ```
3. **Remove Configurations**: This command allows users to remove specific configurations from an existing data template. It can remove settings like record count, language, namespaces, output format, and fields to exclude.However record count and language cannot be removed globally, and at least one output format is required.
   ```bash
   sf template remove -t <templateFileName> [-s <sObject>] [-l <languageCode>] [-c <recordCount>] [-x <namespaceToExclude>] [-f <outputFormat>] [-e <fieldsToExclude>]
   ```
4. **Validate Template**: This command validates a data generation template file, ensuring that it is correctly configured for Salesforce. It checks the template for correctness, connects to Salesforce (using environment variables for credentials), and logs any warnings or errors found in the template's configuration. This step ensures that all objects, fields, and settings are properly defined before use.

   ```bash
   sf template validate -t <templateFileName>
   ```
5. **Generate Data**: The generate command reads a Salesforce data generation template and generates data based on the objects and settings defined within it. It also excludes the  fields from the data template file that have been specified, ensuring that unwanted fields are omitted from the generated records. This command is designed to facilitate the creation of tailored datasets for Salesforce objects.

   ```bash
   sf data generate -t <templateFileName>
   ```

---

## Command Help
To access command help:
```bash
sf <template/data> <command> --help
```

---

## References
- [Mockaroo API Documentation](https://www.mockaroo.com/docs)
- [Salesforce CLI Setup Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_cli.htm)
- [Salesforce Plugin Installation Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_setup.meta/sfdx_setup/sfdx_setup_install_plugin.htm)

---

## Support
For questions, suggestions, or bug reports, please contact:  
📧 [smock-it@concret.io](mailto:smock-it@concret.io)
