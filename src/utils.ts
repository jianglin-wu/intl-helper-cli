import glob from 'glob';

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

/**
 * 英文首字母大写
 *
 * @param {string} str
 * @returns
 */
export function formatEn(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1);
}
