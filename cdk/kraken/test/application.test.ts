import * as fs from 'fs';
import { ApplicationStack } from '../src';
import { TestingApp } from './utils';


// ApplicationStack
test('default', () => {
  const app = TestingApp({ createValidateWorkflow: false });
  new ApplicationStack(app, {
    djangoProjectName: 'example',
    dockerImageBaseName: 'example',
  });
  app.synth();
  expect(fs.readdirSync(app.outdir)).toEqual([
    'cdkactions_build-and-deploy.yaml',
  ]);
  expect(fs.readFileSync(`${app.outdir}/cdkactions_build-and-deploy.yaml`, 'utf-8')).toMatchSnapshot();
},
);

test('integration tests', () => {
  const app = TestingApp({ createValidateWorkflow: false });
  new ApplicationStack(app, {
    djangoProjectName: 'example',
    dockerImageBaseName: 'example',
    integrationTests: true,
  });
  app.synth();
  expect(fs.readdirSync(app.outdir)).toEqual([
    'cdkactions_build-and-deploy.yaml',
  ]);
  expect(fs.readFileSync(`${app.outdir}/cdkactions_build-and-deploy.yaml`, 'utf-8')).toMatchSnapshot();
},
);
