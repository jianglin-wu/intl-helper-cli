/* eslint-disable import/prefer-default-export */
import traverse, { NodePath } from '@babel/traverse';
import * as babelTypes from '@babel/types';
import { formatTemplateTexts } from '../utils';

type TextNode =
  | NodePath<babelTypes.JSXText>
  | NodePath<babelTypes.StringLiteral>
  | NodePath<babelTypes.TemplateLiteral>;

/**
 * 检测文本节点是否是 formatMessage 调用函数中的 defaultMessage | description 属性。
 *
 * @param {TextNode} nodePath
 * @returns
 */
function checkInFormatMessageFn(nodePath: TextNode) {
  const parentCall = nodePath.findParent((p) => p.isCallExpression());
  const parentProperty = nodePath.findParent((p) => p.isObjectProperty());
  const isFormatMessageFn =
    parentCall && parentCall.get('callee').toString() === 'formatMessage';
  const propertyName = parentProperty && parentProperty.get('key').toString();
  const isIgnoreProperty =
    propertyName === 'defaultMessage' || propertyName === 'description';
  return isFormatMessageFn && isIgnoreProperty;
}

/**
 * 检测文本节点是否是 FormattedMessage 调用函数中的 defaultMessage | description 属性。
 *
 * @param {TextNode} nodePath
 * @returns
 */
function checkInFormattedMessageFc(nodePath: TextNode) {
  const parentCall = nodePath.findParent((p) => p.isJSXOpeningElement());
  const parentProperty = nodePath.findParent((p) => p.isJSXAttribute());
  const isFormatMessageFn =
    parentCall && parentCall.get('name').toString() === 'FormattedMessage';
  const propertyName = parentProperty && parentProperty.get('name').toString();
  const isDefaultProperty =
    propertyName === 'defaultMessage' || propertyName === 'description';
  return isFormatMessageFn && isDefaultProperty;
}

/**
 * 收集文本字符串
 *
 * @param {babelTypes.Node} ast
 * @param {(text: string) => void} appendText
 */
export function collectText(
  ast: babelTypes.Node,
  appendText: (text: string) => void,
) {
  traverse(ast, {
    JSXText(nodePath) {
      const text = nodePath.node.value.trim();
      if (
        !checkInFormatMessageFn(nodePath) &&
        !checkInFormattedMessageFc(nodePath)
      ) {
        appendText(text);
      }
    },
    StringLiteral(nodePath) {
      const text = nodePath.node.value;
      if (
        !checkInFormatMessageFn(nodePath) &&
        !checkInFormattedMessageFc(nodePath)
      ) {
        appendText(text);
      }
    },
    TemplateLiteral(nodePath) {
      const texts = nodePath.node.quasis.map((item) => item.value.raw);
      const text = formatTemplateTexts(texts);
      if (
        !checkInFormatMessageFn(nodePath) &&
        !checkInFormattedMessageFc(nodePath)
      ) {
        appendText(text);
      }
    },
  });
}
