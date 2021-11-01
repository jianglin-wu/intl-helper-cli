import path from 'path';
import fse from 'fs-extra';
import glob from 'glob';

export function isIncludesChinese(string) {
  return /[\u4e00-\u9fa5]+/.test(string);
}

export function formatTemplateTexts(texts) {
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

export function localesOutput(data, rootPath) {
  const outputFile = path.resolve(rootPath, './locales/zh-CN.js');
  fse.outputFileSync(
    outputFile,
    `export default ${JSON.stringify(data, null, 2)}`,
  );
}
