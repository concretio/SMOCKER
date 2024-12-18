import * as path from 'node:path';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';

describe('TemplateValidate Command', () => {
  const testDir = path.join(process.cwd(), 'data_gen/templates');
  const testFile = path.join(testDir, 'testTemplateValidate.json');

  const templateName = 'testTemplatevalidate';
  const invalidTemplateName = 'testTemplateInvalid';
  before(() => {
    if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
    const sampleData = {
      templateFileName: 'testTemplateUpsert.json',
      namespaceToExclude: ['ns1', 'ns2'],
      outputFormat: ['csv'],
      language: 'en',
      count: 1,
      sObjects: [
        {
          contact: {
            language: 'en',
            count: 25,
            fieldsToExclude: ['cleanstatus', 'jigsaw'],
          },
        },
        {
          account: {
            language: 'en',
            count: 25,
            fieldsToExclude: ['cleanstatus', 'jigsaw'],
          },
        },
      ],
    };
    fs.writeFileSync(testFile, JSON.stringify(sampleData, null, 2), 'utf8');
  });

  after(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  it('[BS_TC_146] Validate the behavior of the validate command with the correct template name', (done) => {
    const command = `sf template validate -t ${templateName}`;
    exec(command, (error, stdout) => {
        if (error) {
            return done(error);
        }
        const commonMsg = 'Success: SF Connection established.';
        const expectedValidationMsg = "Successfully validated 'testTemplatevalidate.json' and no invalid object/fields were found!";
        if (!stdout.includes(commonMsg) || !stdout.includes(expectedValidationMsg)) {
            return done(new Error('some of the Expected messages not found in stdout.'));
        }
        done();
    });
  });

  it('[BS_TC_147] Validate the behavior of the validate command with an incorrect template name', (done) => {
    const command = `sf template validate -t ${invalidTemplateName}` ;
    exec(command, (error, stdout, stderr) => {
        const expectedErrorMessage = `File: testTemplateInvalid is not present at this path: ${path.join('C:', 'Users', 'Kundan Kumar Sharma', 'Documents', 'SMOCKER', 'data_gen', 'templates', 'testTemplateInvalid.json')}`;
        if (stderr.includes(expectedErrorMessage)) {
        done();
      } else {
        done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
      }
    });
  });

  /* Note: Change the mock data according to the scenario for invalid object and its fields */

  it('[BS_TC_148] Validate the behavior when an invalid object is present in the template.', (done) => {
    const command = `sf template validate -t ${templateName}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Command Execution Error:', error);
        return done(error);
      }
      const successMessage = 'Success: SF Connection established.';
      const warningMessage = 'Warning: SObjects do not exist or cannot be accessed:\n -> contacts';
      const noteMessage =
        'Note: Still we keep these populated these values, You can change them anytime from the data template!';

      if (!stdout.includes(successMessage) || !stderr.includes(warningMessage) || !stderr.includes(noteMessage)) {
        return done(new Error('some of the Expected messages not found in stdout.'));
      }
      done();
    });
  });

  it('[BS_TC_149] Validate the behavior when an invalid field is used', (done) => {
    const command = `sf template validate -t ${templateName}`;
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Command Execution Error:', error);
        return done(error);
      }      
      
      const successMessage = 'Success: SF Connection established.';
      const warningMessage = 'Warning: Fields do not exist or cannot be accessed:\n -> account: jig';
      const noteMessage =
        'Note: Still we keep these populated these values, You can change them anytime from the data template!';

      if (!stdout.includes(successMessage) || !stderr.includes(warningMessage) || !stderr.includes(noteMessage)) {
        return done(new Error('some of the Expected messages not found in stdout.'));
      }
      done();
    });
  });
});
