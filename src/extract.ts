import path from 'path';
import fse from 'fs-extra';
import traverse from '@babel/traverse';
import { codeParse } from './common';
import {
  formatTemplateTexts,
  findFiles,
  isIncludesChinese,
  localesOutput,
} from './utils';

function generateLocale(texts, namespace) {
  const conf = {};
  texts.forEach((text, index) => {
    conf[`${namespace}.abc${index}`] = text;
  });
  return conf;
}

function extractStringList(ast, appendItem) {
  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.trim();
      appendItem(text);
    },
    StringLiteral(path) {
      const text = path.node.value;
      appendItem(text);
    },
    TemplateLiteral(path) {
      const texts = path.node.quasis.map((item) => item.value.raw);
      appendItem(formatTemplateTexts(texts));
    },
  });
}

function extractChinese(list, rootPath) {
  const strList = rootPath.split('/');
  const namespace = strList[strList.length - 1];
  return generateLocale(list, namespace);
}

export default function extract(rootPath) {
  const files = findFiles(rootPath);
  const texts = new Set();
  const appendItem = (text) => {
    if (text !== '' && isIncludesChinese(text)) {
      texts.add(text);
    }
  };
  files.forEach((filePath) => {
    console.log('filePath:', filePath);
    const code = fse.readFileSync(path.resolve(rootPath, filePath)).toString();
    const ast = codeParse(code);
    extractStringList(ast, appendItem);
  });
  const data = extractChinese([...texts], rootPath);
  localesOutput(data, process.cwd());
}
