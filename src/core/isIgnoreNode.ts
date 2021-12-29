import { TextNode } from './extract';

/**
 * 检测文本节点是否是 formatMessage 调用函数中的 defaultMessage | description 属性。
 *
 * @param {TextNode} nodePath
 * @returns
 */
export function checkInFormatMessageFn(nodePath: TextNode): boolean {
  const parentCall = nodePath.findParent((p) => p.isCallExpression());
  const parentProperty = nodePath.findParent((p) => p.isObjectProperty());
  const isFormatMessageFn =
    parentCall && parentCall.get('callee').toString() === 'formatMessage';
  const propertyName = parentProperty && parentProperty.get('key').toString();
  const isIgnoreProperty =
    propertyName === 'defaultMessage' || propertyName === 'description';
  return !!(isFormatMessageFn && isIgnoreProperty);
}

/**
 * 检测文本节点是否是 FormattedMessage 调用函数中的 defaultMessage | description 属性。
 *
 * @param {TextNode} nodePath
 * @returns
 */
export function checkInFormattedMessageFc(nodePath: TextNode): boolean {
  const parentCall = nodePath.findParent((p) => p.isJSXOpeningElement());
  const parentProperty = nodePath.findParent((p) => p.isJSXAttribute());
  const isFormatMessageFn =
    parentCall && parentCall.get('name').toString() === 'FormattedMessage';
  const propertyName = parentProperty && parentProperty.get('name').toString();
  const isDefaultProperty =
    propertyName === 'defaultMessage' || propertyName === 'description';
  return !!(isFormatMessageFn && isDefaultProperty);
}

export default (nodePath: TextNode): boolean =>
  checkInFormatMessageFn(nodePath) || checkInFormattedMessageFc(nodePath);
