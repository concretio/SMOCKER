import * as path from 'node:path';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';

describe('TemplateUpsert Command', () => {
  const testDir = path.join(process.cwd(), 'data_gen/templates');
  const testFile = path.join(testDir, 'testTemplateUpsert.json');

  const verifyCommandOutput = (stdout: string, expectedMessage: string, done: Mocha.Done) => {
    // console.log('Command Output:', stdout);
    if (!stdout.includes(expectedMessage)) {
      return done(new Error(`Expected message "${expectedMessage}" not found in stdout.`));
    }
    done();
  };

  const templateName = 'testTemplateUpsert';
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
      ],
    };
    fs.writeFileSync(testFile, JSON.stringify(sampleData, null, 2), 'utf8');
  });

  after(() => {
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
  });

  /* --------------------Global Level Testing-------------------------- */

  it('Verify upsert namespaceToExclude', (done) => {
    const command = `sf template upsert -t ${templateName} -x ns3`;
    exec(command, (error, stdout) => {
      if (error) {
        return done(error);
      }
      const expectedMessage = "Updated 'namespaceToExclude' to: ns1, ns2, ns3";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  it('Verify upsert outputFormat', (done) => {
    const command = `sf template upsert -t ${templateName} -f json`;
    exec(command, (error, stdout) => {
      if (error) {
        return done(error);
      }
      const expectedMessage = "Updated 'outputFormat' to: csv, json";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  it('Verify upsert modifying count at global level', (done) => {
    const command = `sf template upsert -t ${templateName} -c 50`;
    exec(command, (error, stdout) => {
      if (error) {
        return done(error);
      }
      const expectedMessage = "Setting 'count' to: 50";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  it('Verify upsert modifying language at global level', (done) => {
    const command = `sf template upsert -t ${templateName} -l jp`;
    exec(command, (error, stdout) => {
      if (error) {
        return done(error);
      }
      const expectedMessage = "Setting 'language' to: jp";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  it('Verify upsert modifying language at object setting', (done) => {
    const command = `sf template upsert -t ${templateName} -l en -s contact`;
    exec(command, (error, stdout) => {
      if (error) {
        return done(error);
      }
      const expectedMessage = "Setting 'language' to: en";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  // /* -----------------object Specific Settings----------------------*/

  it('Verify upsert modifying count at object setting', (done) => {
    const command = `sf template upsert -t ${templateName} -c 500 -s contact`;
    exec(command, (error, stdout) => {
      if (error) {
        // console.error('Exec Error:', error);
        return done(error);
      }
      const expectedMessage = "Setting 'count' to: 500";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  it('Verify upsert fieldsToExclude', (done) => {
    const command = `sf template upsert -t ${templateName} -e name -s contact`;
    exec(command, (error, stdout) => {
      if (error) {
        return done(error);
      }
      const expectedMessage = "Updated 'fieldsToExclude' to: cleanstatus, jigsaw, name";
      verifyCommandOutput(stdout, expectedMessage, done);
    });
  });

  /* -----------------Error Handling Testing-------------------------------*/

  it('Verify upsert with error when no valid outputFormat specified', (done) => {
    const command = `sf template upsert -t ${templateName} -f xml`;
    exec(command, (error, stdout, stderr) => {
      const expectedErrorMessage = 'Process halted: Invalid output format passed. supports `csv`, `json` and `di` only';

      if (stderr.includes(expectedErrorMessage)) {
        done();
      } else {
        done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
      }
    });
  });

  it('Verify upsert with error when no valid language specified', (done) => {
    const command = `sf template upsert -t ${templateName} -l us`;
    exec(command, (error, stdout, stderr) => {
      const expectedErrorMessage = 'Invalid language input. supports `en` or `jp` only';

      if (stderr.includes(expectedErrorMessage)) {
        done();
      } else {
        done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
      }
    });
  });
});
