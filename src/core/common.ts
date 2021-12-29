// eslint-disable-next-line import/prefer-default-export
import prettier from 'prettier';
import md5 from 'md5';
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
  texts.forEach((text) => {
    conf[`${namespace}.${md5(text)}`] = text;
  });
  return conf;
}

export function generateCode(ast: babelTypes.Node) {
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
  return code;
}

const prettierDefaultOptions = {
  semi: true,
};
export async function codeFormat(code: string, filePath?: string) {
  let options;
  if (filePath) {
    options = await prettier.resolveConfig(filePath);
  }
  const formatted = prettier.format(code, {
    parser: 'babel-ts',
    ...(options || prettierDefaultOptions),
  });
  return formatted;
}
