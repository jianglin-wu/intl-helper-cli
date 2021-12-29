/* eslint-disable import/prefer-default-export */
import traverse, { NodePath } from '@babel/traverse';
import * as babelTypes from '@babel/types';
import { formatTemplateTexts } from '../utils';
import isIgnoreTextNode from './isIgnoreNode';

export type TextNode =
  | NodePath<babelTypes.JSXText>
  | NodePath<babelTypes.StringLiteral>
  | NodePath<babelTypes.TemplateLiteral>;

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
  const scanTextNode = (nodePath: TextNode, text: string) => {
    if (isIgnoreTextNode(nodePath)) {
      return;
    }
    appendText(text);
  };
  traverse(ast, {
    JSXText(nodePath) {
      const text = nodePath.node.value.trim();
      scanTextNode(nodePath, text);
    },
    StringLiteral(nodePath) {
      const text = nodePath.node.value;
      scanTextNode(nodePath, text);
    },
    TemplateLiteral(nodePath) {
      const texts = nodePath.node.quasis.map((item) => item.value.raw);
      const text = formatTemplateTexts(texts);
      scanTextNode(nodePath, text);
    },
  });
}
