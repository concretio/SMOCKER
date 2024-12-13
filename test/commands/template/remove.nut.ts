import * as path from 'node:path';
import * as fs from 'node:fs';
import { exec } from 'node:child_process';
describe('TemplateRemove Command', () => {
    const testDir = path.join(process.cwd(), 'data_gen/templates');
    const testFile = path.join(testDir, 'testTemplate.json');
    const verifyCommandOutput = (stdout: string, expectedMessage: string, done: Mocha.Done) => {
        if (!stdout.includes(expectedMessage)) {
            return done(new Error(`Expected message "${expectedMessage}" not found in stdout.`));
        }
        done();
    };
    const templateName = 'testTemplate';
    before(() => {
        if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true });
        const sampleData = {
            templateFileName: 'testTemplate.json',
            namespaceToExclude: [
                'nameSpace1',
                'nameSpace2',
                'namespace3',
                'namespace8',
                'namespace9'
            ],
            outputFormat: [
                'di',
                'csv',
                'xml',
                'json'
            ],
            language: 'en',
            count: 1,
            sObjects: [
                {
                    contact: {
                        language: 'en',
                        count: 25,
                        fieldsToExclude: [
                            'cleanstatus',
                            'jigsaw'
                        ]
                    }
                },
                {
                    lead: {
                        language: 'en',
                        count: 25,
                        fieldsToExclude: [
                            'cleanstatus',
                            'jigsaw',
                            'fax',
                            'email'
                        ]
                    }
                },
                {
                    account: {
                        language: 'jp',
                        count: 25,
                        fieldsToExclude: [
                            'cleanstatus',
                            'jigsaw'
                        ]
                    }
                },
                {
                    case: {
                        language: 'en',
                        count: 2,
                        fieldsToExclude: [
                            'fax',
                            'phone',
                            'jigsaw'
                        ]
                    }
                }
            ]
        };
        fs.writeFileSync(testFile, JSON.stringify(sampleData, null, 2), 'utf8');
    });
    after(() => {
        // Cleanup: Remove the test file created in the before method
        if (fs.existsSync(testFile)) {
            fs.unlinkSync(testFile);
        }
    });
    it('Verify remove namespaceToExclude', (done) => {
        const command = `sf template remove -t ${templateName} -x nameSpace1`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }

            const expectedMessage = "Removing 'nameSpace1' from the namespaceToExclude."
            if (!stdout.includes(expectedMessage)) {
                return done(new Error(`Expected message "${expectedMessage}" not found in stdout.`));
            }
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Verify removing multiple namespaceToExclude', (done) => {
        const command = `sf template remove -t ${templateName} -x nameSpace8, nameSpace9`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Removing 'nameSpace8, nameSpace9' from the namespaceToExclude."
            if (!stdout.includes(expectedMessage)) {
                return done(new Error(`Expected message "${expectedMessage}" not found in stdout.`));
            }
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Validate when object name is Capital and removing the language, count and the fields', (done) => {
        const command = `sf template remove -t ${templateName} -l -c -e email -s Lead`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedCountMsg = 'Removing \'count\' from the sobject lead settings.';
            const expectedLanguageMsg = 'Removing \'language\' from the sobject lead settings.';
            const expectedFieldsToExcludeMsg = 'Removing \'email\' from the \'fieldsToExclude\' of sobject \'lead\' settings';
            if (!stdout.includes(expectedCountMsg) || !stdout.includes(expectedLanguageMsg) || !stdout.includes(expectedFieldsToExcludeMsg)) {
                return done(new Error('some of the Expected messages not found in stdout.'));
            }
            done();
        });
    });
    it('Validate removing both the language, count from the sObject', (done) => {
        const command = `sf template remove -t ${templateName} -s contact -l -c`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedCountMsg = 'Removing \'count\' from the sobject contact settings.';
            const expectedLanguageMsg = 'Removing \'language\' from the sobject contact settings.';
            if (!stdout.includes(expectedCountMsg) || !stdout.includes(expectedLanguageMsg)) {
                return done(new Error('some of the Expected messages not found in stdout.'));
            }
            done();
        });
    });
    it('Verify error when removing all values from outputFormat', (done) => {
        const command = `sf template remove -t ${templateName} -f di,csv,XML,json`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'All the values from \'output-format\' cannot be deleted! You must leave at least one value.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify remove outputFormat', (done) => {
        const command = `sf template remove -t ${templateName} -f di`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Removing 'di' from the outputFormat.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Verify removing count from sObject', (done) => {
        const command = `sf template remove -t ${templateName} -c -s case`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Removing 'count' from the sobject case settings.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Verify removing language from sObject', (done) => {
        const command = `sf template remove -t ${templateName} -l -s case`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Removing 'language' from the sobject case settings.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Verify remove fieldsToExclude from specified Object ', (done) => {
        const command = `sf template remove -t ${templateName} -s account -e jigsaw,CLEANSTATUS`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Removing 'jigsaw, CLEANSTATUS' from the 'fieldsToExclude' of sobject 'account' settings.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Verify error when removing template level count', (done) => {
        const command = `sf template remove -t ${templateName} -c`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'Default count can not be deleted! You can update instead.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify error when removing template level language', (done) => {
        const command = `sf template remove -t ${templateName} -l`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'Default language can not be deleted! You can update instead.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify error when removing outputFormat along with sObject', (done) => {
        const command = `sf template remove -t ${templateName} -s contact -f xml`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'You cannot use global flag "outputFormat" with an SObject flag.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify error when removing namespace along with sObject', (done) => {
        const command = `sf template remove -t ${templateName} -s contact -x namespace3`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'You cannot use global flag "namespaceToExclude" with an SObject flag.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify error when removing outputFormat with non-existing values', (done) => {
        const command = `sf template remove -t ${templateName} -f test1, test2`;
        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'Values \'test1, test2\' do not exist in the outputFormat.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify error when removing outputFormat non-existing values', (done) => {
        const command = `sf template remove -t ${templateName} -f nameSpace5, nameSpace6`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'Values \'nameSpace5, nameSpace6\' do not exist in the outputFormat.';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify error when removing fieldsToExclude non-existing values', (done) => {
        const command = `sf template remove -t ${templateName} -s lead -e value1, value2`;
        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'Values \'value1, value2\' do not exist in the \'fieldsToExclude\' of sobject \'lead\' settings';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify removing single Object from the template', (done) => {
        const command = `sf template remove -t ${templateName} -s lead`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Object 'lead' has been removed from the data template file.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });
    it('Verify removing multiple sObjects from the template', (done) => {
        const command = `sf template remove -t ${templateName} -s account,contact`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Object 'account, contact' has been removed from the data template file.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });

    it('Verify error when removing when removing a template file.', (done) => {
        const command = `sf template remove -t ${templateName}`;

        exec(command, (error, stdout, stderr) => {
            const expectedErrorMessage = 'Data Template File cannot be deleted! You must specify at least one setting flag to remove';
            if (stderr.includes(expectedErrorMessage)) {
                done();
            } else {
                done(new Error(`Expected error message "${expectedErrorMessage}" not found in stderr.`));
            }
        });
    });
    it('Verify remove outputFormat in capital Letter', (done) => {
        const command = `sf template remove -t ${templateName} -f JSON`;
        exec(command, (error, stdout) => {
            if (error) {
                console.error(`exec error: ${JSON.stringify(error)}`);
                return done(error);
            }
            const expectedMessage = "Removing 'JSON' from the outputFormat.";
            verifyCommandOutput(stdout, expectedMessage, done);
        });
    });

});
