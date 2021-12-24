import path from 'path';
import fse from 'fs-extra';
import glob from 'glob';
import { ILocaleData } from './interface';

export function isIncludesChinese(string: string) {
  return /[\u4e00-\u9fa5]+/.test(string);
}

export function formatTemplateTexts(texts: string[]) {
  let text;
  if (texts.length <= 2) {
    text = texts.join('{value}');
  } else {
    text = texts.reduce((str, item, index) => `${str}{value${index}}${item}`);
  }
  return text;
}

export function findFiles(rootPath: string): string[] {
  return glob.sync(
    '{*.{js,jsx,ts,tsx},!(node_modules|locales|output)/**/*.{js,jsx,ts,tsx}}',
    {
      cwd: rootPath,
    },
  );
}

export function generateLocaleFile(
  rootPath: string,
  data: ILocaleData,
  filename?: string,
) {
  const code = `export default ${JSON.stringify(data, null, 2)}`;
  if (filename) {
    const outputFile = path.resolve(rootPath, './locales/', filename);
    fse.outputFileSync(outputFile, code);
  } else {
    // eslint-disable-next-line no-console
    console.log(code);
  }
}

/**
 * 英文首字母大写
 *
 * @param {string} str
 * @returns
 */
export function formatEn(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}
