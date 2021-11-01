import path from 'path';
import fse from 'fs-extra';
import template from '@babel/template';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as babelTypes from '@babel/types';
import { codeParse } from './common';
import { formatTemplateTexts, findFiles } from './utils';

function generateCode(ast: babelTypes.Node, filePath: string) {
  const { code } = generate(ast, {
    comments: true,
    compact: false,
    concise: false,
    retainFunctionParens: true,
    retainLines: true,
    minified: false,
  });
  fse.outputFileSync(filePath, code);
}

const createCallNode = (id, values?: babelTypes.Node[]) => {
  const newNode = template.expression(`formatMessage({ id: '${id}' })`)();
  if (values) {
    newNode.arguments.push(values);
  }
  return newNode;
};
const createJsxNode = (id) => {
  const newNode = babelTypes.jsxElement(
    babelTypes.jsxOpeningElement(
      babelTypes.jsxIdentifier('FormattedMessage'),
      [
        babelTypes.jsxAttribute(
          babelTypes.jsxIdentifier('id'),
          babelTypes.stringLiteral(id),
        ),
      ],
      true,
    ),
    null,
    [],
    true,
  );
  return newNode;
};

function injectFormatMassage(ast: babelTypes.Node, localeMap) {
  traverse(ast, {
    JSXText(path) {
      const text = path.node.value.trim();
      if (localeMap[text]) {
        let newNode = createJsxNode(localeMap[text]);
        path.replaceWith(newNode);
      }
    },
    StringLiteral(path) {
      const text = path.node.value;
      if (localeMap[text]) {
        let newNode = createCallNode(localeMap[text]);
        if (path.parent.type === 'JSXAttribute') {
          newNode = babelTypes.jsxExpressionContainer(newNode);
        }
        path.replaceWith(newNode);
      }
    },
    TemplateLiteral(path) {
      const expressions = path.node.expressions;
      const texts = path.node.quasis.map((item) => item.value.raw);
      let text = formatTemplateTexts(texts);
      if (!localeMap[text]) {
        return;
      }
      let values;
      if (expressions.length === 1) {
        values = babelTypes.objectExpression([
          babelTypes.objectProperty(
            babelTypes.identifier('value'),
            expressions[0],
          ),
        ]);
      } else if (expressions.length > 1) {
        const items = expressions.map((item, index) =>
          babelTypes.objectProperty(
            babelTypes.identifier(`value${index + 1}`),
            item,
          ),
        );
        values = babelTypes.objectExpression(items);
      }
      let newNode = createCallNode(localeMap[text], values);
      path.replaceWith(newNode);
    },
  });
}

export default function inject(
  rootPath: string,
  localeFilePath: string,
  outputPath: string,
) {
  const files = findFiles(rootPath);
  const localeCode = fse
    .readFileSync(localeFilePath)
    .toString()
    .replace('export default ', '');
  let localeInfo: { [key: string]: string } = {};
  eval(`localeInfo = ${localeCode}`);
  const localeMap: { [key: string]: string } = {};
  Object.entries(localeInfo).forEach(
    ([key, value]) => (localeMap[value] = key),
  );
  files.forEach((filePath) => {
    console.log('filePath:', filePath);
    const code: string = fse
      .readFileSync(path.resolve(rootPath, filePath))
      .toString();
    const ast = codeParse(code);
    injectFormatMassage(ast, localeMap);
    const outputFile = path.resolve(outputPath, filePath);
    generateCode(ast, outputFile);
  });
}
