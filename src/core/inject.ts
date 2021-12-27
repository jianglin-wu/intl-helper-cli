import traverse from '@babel/traverse';
import * as babelTypes from '@babel/types';
import { codeParse, generateCode } from './common';
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

export function readLocaleData(code: string) {
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

export function appendLocaleData(localeCode: string, appendData: ILocaleData) {
  const existed = readLocaleData(localeCode);
  const ast = codeParse(localeCode);
  traverse(ast, {
    ExportDefaultDeclaration(nodePath) {
      if (!babelTypes.isObjectExpression(nodePath.node.declaration)) {
        return;
      }
      const { properties } = nodePath.node.declaration;
      Object.entries(appendData).forEach(([key, value]) => {
        if (existed[key]) {
          if (existed[key] !== value) {
            // eslint-disable-next-line no-console
            console.error('存在冲突字段：', key);
            // eslint-disable-next-line no-console
            console.error(
              `已有属性值 "${existed[key]}" 与新增属性值 "${value}" 冲突`,
            );
          }
          return;
        }
        const propertyNode = babelTypes.objectProperty(
          babelTypes.stringLiteral(key),
          babelTypes.stringLiteral(value),
        );
        properties.push(propertyNode);
      });
    },
  });
  return generateCode(ast);
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
