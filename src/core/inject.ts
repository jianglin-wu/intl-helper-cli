import fse from 'fs-extra';
import traverse from '@babel/traverse';
import * as babelTypes from '@babel/types';
import { codeParse } from './common';
import { formatTemplateTexts } from '../utils';
import { ILocaleData } from '../interface';

/**
 * 创建 formatMessage 函数调用节点
 *
 * formatMessage({
 *   id: 'id',
 *   defaultMessage: '',
 *   description: '',
 * }, {
 *   value: 'xxx',
 * })
 *
 * @param {string} id
 * @param {string} defaultMessage
 * @param {babelTypes.ObjectExpression} [values]
 * @returns
 */
function createCallNode(
  id: string,
  defaultMessage: string,
  values?: babelTypes.ObjectExpression,
): babelTypes.CallExpression {
  const descriptor = [
    babelTypes.objectProperty(
      babelTypes.identifier('id'),
      babelTypes.stringLiteral(id),
    ),
  ];
  if (values) {
    descriptor.push(
      babelTypes.objectProperty(
        babelTypes.identifier(values ? 'description' : 'defaultMessage'),
        babelTypes.stringLiteral(defaultMessage),
      ),
    );
  }
  const callArguments = [babelTypes.objectExpression(descriptor)];
  if (values) {
    callArguments.push(values);
  }
  const newNode = babelTypes.callExpression(
    babelTypes.identifier('formatMessage'),
    callArguments,
  );
  return newNode;
}

/**
 * 创建 FormattedMessage 组件调用节点
 *
 * <FormattedMessage id="id" defaultMessage="" />
 *
 * @param {string} id
 * @param {string} defaultMessage
 * @returns
 */
function createJsxNode(
  id: string,
  defaultMessage: string,
): babelTypes.JSXElement {
  const newNode = babelTypes.jsxElement(
    babelTypes.jsxOpeningElement(
      babelTypes.jsxIdentifier('FormattedMessage'),
      [
        babelTypes.jsxAttribute(
          babelTypes.jsxIdentifier('id'),
          babelTypes.stringLiteral(id),
        ),
        babelTypes.jsxAttribute(
          babelTypes.jsxIdentifier('defaultMessage'),
          babelTypes.stringLiteral(defaultMessage),
        ),
      ],
      true,
    ),
    null,
    [],
    true,
  );
  return newNode;
}

function createFormatterVariables(
  expressions: Array<babelTypes.Expression>,
): babelTypes.ObjectExpression | undefined {
  if (expressions.length === 1) {
    return babelTypes.objectExpression([
      babelTypes.objectProperty(babelTypes.identifier('value'), expressions[0]),
    ]);
  }
  if (expressions.length > 1) {
    const items = expressions.map((item, index) =>
      babelTypes.objectProperty(
        babelTypes.identifier(`value${index + 1}`),
        item,
      ),
    );
    return babelTypes.objectExpression(items);
  }
  return undefined;
}

export function readLocaleData(filePath: string) {
  const code: string = fse.readFileSync(filePath).toString();
  const ast = codeParse(code);
  const localeData: ILocaleData = {};
  traverse(ast, {
    ExportDefaultDeclaration(nodePath) {
      if (!babelTypes.isObjectExpression(nodePath.node.declaration)) {
        return;
      }
      const { properties } = nodePath.node.declaration;
      properties.forEach((propertyNode) => {
        if (
          babelTypes.isProperty(propertyNode) &&
          babelTypes.isStringLiteral(propertyNode.key) &&
          babelTypes.isStringLiteral(propertyNode.value)
        ) {
          localeData[propertyNode.key.value] = propertyNode.value.value;
        }
      });
    },
  });
  return localeData;
}

export function injectFormatMassage(
  ast: babelTypes.Node,
  localeMap: ILocaleData,
) {
  traverse(ast, {
    JSXText(nodePath) {
      const text = nodePath.node.value.trim();
      if (localeMap[text]) {
        const newNode = createJsxNode(localeMap[text], text);
        nodePath.replaceWith(newNode);
        nodePath.skip();
      }
    },
    StringLiteral(nodePath) {
      const text = nodePath.node.value;
      if (localeMap[text]) {
        let newNode:
          | babelTypes.CallExpression
          | babelTypes.JSXExpressionContainer = createCallNode(
          localeMap[text],
          text,
        );
        if (nodePath.parent.type === 'JSXAttribute') {
          newNode = babelTypes.jsxExpressionContainer(newNode);
        }
        nodePath.replaceWith(newNode);
        nodePath.skip();
      }
    },
    TemplateLiteral(nodePath) {
      const { expressions } = nodePath.node as {
        expressions: Array<babelTypes.Expression>;
      };
      const texts = nodePath.node.quasis.map((item) => item.value.raw);
      const text = formatTemplateTexts(texts);
      if (!localeMap[text]) {
        return;
      }
      const values = createFormatterVariables(expressions);
      const newNode = createCallNode(localeMap[text], text, values);
      nodePath.replaceWith(newNode);
      nodePath.skip();
    },
  });
}
