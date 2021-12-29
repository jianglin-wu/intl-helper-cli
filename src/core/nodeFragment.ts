import * as babelTypes from '@babel/types';
import template from '@babel/template';

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
export function createCallNode(
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
  if (defaultMessage) {
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
export function createJsxNode(
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

export function createFormatterVariables(
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

export function createUseIntlNode(): babelTypes.VariableDeclaration {
  return template.ast(
    'const { formatMessage } = useIntl();',
  ) as babelTypes.VariableDeclaration;
}
