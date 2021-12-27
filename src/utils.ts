import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import glob from 'glob';
import { ILocaleData } from './interface';
import { appendLocaleData } from './core/inject';

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
  return glob
    .sync(
      '{*.{ts,tsx},!(node_modules|locales|output)/**/*.{ts,tsx},**/!(node_modules|locales|output)/**/*.{ts,tsx}}',
      {
        cwd: rootPath,
      },
    )
    .filter(
      (filepath) =>
        !/\/locales\//.test(filepath) &&
        !/\/output\//.test(filepath) &&
        !/\/node_modules\//.test(filepath),
    );
}

export function generateLocaleCode(
  data: ILocaleData,
  rootPath: string,
  outputFile?: string,
) {
  let localeCode = 'export default {}';
  const outputPath = outputFile ? path.resolve(rootPath, outputFile) : '';
  if (outputFile && fs.existsSync(outputPath)) {
    localeCode = fse.readFileSync(outputPath).toString();
  }
  return appendLocaleData(localeCode, data);
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
