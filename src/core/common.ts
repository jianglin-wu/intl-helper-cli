// eslint-disable-next-line import/prefer-default-export
import md5 from 'md5';
import fse from 'fs-extra';
import { parse } from '@babel/parser';
import generate from '@babel/generator';
import * as babelTypes from '@babel/types';

export function codeParse(code: string) {
  return parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    ranges: true,
  });
}

export function getNamespace(targetPath: string) {
  const strList = targetPath.split('/');
  return strList[strList.length - 1];
}

export function createLocale(namespace: string, texts: string[]) {
  const conf: { [key: string]: string } = {};
  texts.forEach((text, index) => {
    conf[`${namespace}.${md5(text)}${index}`] = text;
  });
  return conf;
}

export function generateCode(ast: babelTypes.Node, filePath?: string) {
  const { code } = generate(ast, {
    comments: true,
    compact: false,
    concise: false,
    retainFunctionParens: true,
    retainLines: true,
    minified: false,
    jsescOption: {
      minimal: true,
    },
  });
  if (filePath) {
    fse.outputFileSync(filePath, code);
  } else {
    // eslint-disable-next-line no-console
    console.log('\n', code);
  }
}
