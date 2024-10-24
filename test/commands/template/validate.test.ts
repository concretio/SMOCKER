// import { TestContext } from '@salesforce/core/testSetup';
// import { expect } from 'chai';
// import { stubSfCommandUx } from '@salesforce/sf-plugins-core';
// import TemplateValidate from '../../../src/commands/template/validate.js';

// describe('template validate', () => {
//   const $$ = new TestContext();
//   let sfCommandStubs: ReturnType<typeof stubSfCommandUx>;

//   beforeEach(() => {
//     sfCommandStubs = stubSfCommandUx($$.SANDBOX);
//   });

//   afterEach(() => {
//     $$.restore();
//   });

//   it('runs hello', async () => {
//     await TemplateValidate.run([]);
//     const output = sfCommandStubs.log
//       .getCalls()
//       .flatMap((c) => c.args)
//       .join('\n');
//     expect(output).to.include('hello world');
//   });

//   it('runs hello with --json and no provided name', async () => {
//     const result = await TemplateValidate.run([]);
//     expect(result.path).to.equal('src/commands/template/validate.ts');
//   });

//   it('runs hello world --name Astro', async () => {
//     await TemplateValidate.run(['--name', 'Astro']);
//     const output = sfCommandStubs.log
//       .getCalls()
//       .flatMap((c) => c.args)
//       .join('\n');
//     expect(output).to.include('hello Astro');
//   });
// });
