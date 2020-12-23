import { DjangoCheck } from '../lib';

test('default', () => {
  const dc = new DjangoCheck(undefined as any, { projectName: 'example' });
  expect(dc.toGHAction()).toMatchSnapshot();
});

test('different python version', () => {
  const dc = new DjangoCheck(undefined as any, { pythonVersion: '2.7', projectName: 'example' });
  expect(dc.toGHAction()).toMatchSnapshot();
});

test('different directory', () => {
  const dc = new DjangoCheck(undefined as any, { projectLocation: 'backend', projectName: 'example' });
  expect(dc.toGHAction()).toMatchSnapshot();
});

test('no lint', () => {
  const dc = new DjangoCheck(undefined as any, { projectName: 'example', black: false, flake8: false });
  expect(dc.toGHAction()).toMatchSnapshot();
});

test('with overrides', () => {
  const dc = new DjangoCheck(undefined as any, { projectName: 'example' }, { continueOnError: true });
  expect(dc.toGHAction()).toMatchSnapshot();
});
