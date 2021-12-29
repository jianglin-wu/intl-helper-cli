/* eslint-disable import/prefer-default-export */
import traverse, { NodePath } from '@babel/traverse';
import * as babelTypes from '@babel/types';
import { formatTemplateTexts } from '../utils';
import { ILocaleData } from '../interface';
import isIgnoreTextNode from './isIgnoreNode';
import {
  createCallNode,
  createJsxNode,
  createFormatterVariables,
  createUseIntlNode,
} from './nodeFragment';

const checkNameFirstCharUpper = (nodePath: NodePath): boolean => {
  const isFirstCharUpper = (name: string = '') => {
    const charCodeAt = name[0].charCodeAt(0);
    return charCodeAt >= 65 && charCodeAt <= 90;
  };
  // 通过函数名是否大写，判断是否为声明组件函数
  if (
    babelTypes.isFunctionDeclaration(nodePath.node) &&
    nodePath.node.id &&
    isFirstCharUpper(nodePath.node.id?.name)
  ) {
    return true;
  }
  // 通过赋值表达式左边变量名是否大写，判断函数是否为组件
  if (
    babelTypes.isFunctionDeclaration(nodePath.node) &&
    babelTypes.isArrowFunctionExpression(nodePath.node) &&
    babelTypes.isAssignmentExpression(nodePath.parent)
  ) {
    if (babelTypes.isIdentifier(nodePath.parent.left)) {
      const left = nodePath.parent.left as babelTypes.Identifier;
      return isFirstCharUpper(left.name);
    }
  }
  return false;
};

const checkReturnJsxElement = (rootNodePath: NodePath): boolean => {
  let hasJSXElement = false;
  rootNodePath.traverse({
    JSXElement() {
      hasJSXElement = true;
    },
  });
  return hasJSXElement;
};

function checkJsxComponentDeclaration(nodePath: NodePath): boolean {
  if (
    nodePath &&
    (nodePath.isArrowFunctionExpression() ||
      nodePath.isFunctionDeclaration()) &&
    (checkNameFirstCharUpper(nodePath) || checkReturnJsxElement(nodePath))
  ) {
    return true;
  }
  return false;
}

function findBlockStatementVariable(
  nodePath: NodePath,
  excludeSubFunction: boolean,
) {
  const findNodes: Array<NodePath<babelTypes.Identifier>> = [];
  const functionVisitor = {
    enter(path: NodePath) {
      if (excludeSubFunction) {
        path.skip();
      }
    },
  };
  nodePath.traverse({
    ArrowFunctionExpression: functionVisitor,
    FunctionDeclaration: functionVisitor,
    VariableDeclarator(variableDeclarationNodePath) {
      variableDeclarationNodePath.traverse({
        Identifier(identifierNodePath) {
          const initNode = identifierNodePath.findParent(
            (item) => item.node === variableDeclarationNodePath.node.init,
          );
          if (!initNode && identifierNodePath.node.name === 'formatMessage') {
            findNodes.push(identifierNodePath);
          }
        },
      });
    },
  });
  return findNodes;
}

function removeFormatMessageDeclaration(
  nodePath: NodePath<babelTypes.Identifier>,
) {
  const variableDeclaration = nodePath.findParent((item) =>
    babelTypes.isVariableDeclaration(item),
  ) as NodePath<babelTypes.VariableDeclaration> | null;
  const objectPattern = nodePath.findParent((item) =>
    item.isObjectPattern(),
  ) as NodePath<babelTypes.ObjectPattern> | null;

  if (objectPattern && objectPattern.node.properties.length > 1) {
    objectPattern.node.properties = objectPattern.node.properties.filter(
      (item) =>
        babelTypes.isProperty(item) &&
        babelTypes.isIdentifier(item.key) &&
        (item.key as babelTypes.Identifier).name !== 'formatMessage',
    );
  } else if (
    variableDeclaration &&
    babelTypes.isBlockStatement(variableDeclaration.parent)
  ) {
    variableDeclaration.parent.body = variableDeclaration.parent.body.filter(
      (item) => item === variableDeclaration.node,
    );
  }
}

function injectUseIntl(nodePath: NodePath): boolean {
  if (nodePath.scope.getBinding('formatMessage')) {
    return false;
  }
  if (checkJsxComponentDeclaration(nodePath)) {
    const jsxComponentDeclaration = nodePath as NodePath<
      babelTypes.ArrowFunctionExpression | babelTypes.FunctionDeclaration
    >;
    if (babelTypes.isBlockStatement(jsxComponentDeclaration.node.body)) {
      const blockStatement = jsxComponentDeclaration.node.body;
      let formatMessageDeclarations = findBlockStatementVariable(
        jsxComponentDeclaration,
        true,
      );
      if (formatMessageDeclarations.length > 0) {
        return false;
      }

      formatMessageDeclarations = findBlockStatementVariable(
        jsxComponentDeclaration,
        false,
      );
      formatMessageDeclarations.forEach((item) =>
        removeFormatMessageDeclaration(item),
      );

      const useNode = createUseIntlNode();
      blockStatement.body.unshift(useNode);
      return true;
    }
  }
  return false;
}

type TraverseState = {
  hasFileChange: boolean;
  hasUseIntl: boolean;
  hasFormattedMessage: boolean;
};

// const functionDeclarationEnter = (
//   nodePath: NodePath<
//     babelTypes.ArrowFunctionExpression | babelTypes.FunctionDeclaration
//   >,
//   state: TraverseState,
// ) => {
//   // eslint-disable-next-line no-param-reassign
//   state.hasCallFormatMessage = false;
// };
// const functionDeclarationExit = (
//   nodePath: NodePath<
//     babelTypes.ArrowFunctionExpression | babelTypes.FunctionDeclaration
//   >,
//   state: TraverseState,
// ) => {
//   if (!state.hasCallFormatMessage) {
//     return;
//   }
//   if (injectUseIntl(nodePath)) {
//     // eslint-disable-next-line no-param-reassign
//     state.hasFileChange = true;
//     // eslint-disable-next-line no-param-reassign
//     state.hasUseIntl = true;
//     // eslint-disable-next-line no-param-reassign
//     state.hasCallFormatMessage = false;
//   }
// };

export function injectFormatMassage(
  ast: babelTypes.Node,
  localeMap: ILocaleData,
): boolean {
  const traverseState: TraverseState = {
    hasFileChange: false,
    hasUseIntl: false,
    hasFormattedMessage: false,
  };
  traverse(
    ast,
    {
      Program: {
        exit(path, state) {
          let importUmi: babelTypes.ImportDeclaration | null = null;
          path.traverse({
            ImportDeclaration(p) {
              const source = p.node.source.value;
              if (source === 'umi') {
                importUmi = p.node;
              }
            },
          });
          const importSpecifier = [];
          if (state.hasFormattedMessage) {
            importSpecifier.push(
              babelTypes.importSpecifier(
                babelTypes.identifier('FormattedMessage'),
                babelTypes.identifier('FormattedMessage'),
              ),
            );
          }
          if (state.hasUseIntl) {
            importSpecifier.push(
              babelTypes.importSpecifier(
                babelTypes.identifier('useIntl'),
                babelTypes.identifier('useIntl'),
              ),
            );
          }
          if (importSpecifier.length === 0) {
            return;
          }
          if (importUmi) {
            importSpecifier.forEach((item) => {
              const { specifiers } = importUmi as babelTypes.ImportDeclaration;
              const hasItem = specifiers.some((specifier) => {
                if (specifier.type === 'ImportSpecifier') {
                  const { imported } = specifier as babelTypes.ImportSpecifier;
                  return (
                    (imported as babelTypes.Identifier).name ===
                    (item.imported as babelTypes.Identifier).name
                  );
                }
                return false;
              });
              if (!hasItem) {
                specifiers.push(item);
                // eslint-disable-next-line no-param-reassign
                state.hasFileChange = true;
              }
            });
          } else {
            const importAst = babelTypes.importDeclaration(
              importSpecifier,
              babelTypes.stringLiteral('umi'),
            );
            path.node.body.unshift(importAst);
            // eslint-disable-next-line no-param-reassign
            state.hasFileChange = true;
          }
        },
      },
      JSXText(nodePath, state) {
        if (isIgnoreTextNode(nodePath)) {
          return;
        }
        const text = nodePath.node.value.trim();
        if (localeMap[text]) {
          const newNode = createJsxNode(localeMap[text], text);
          nodePath.replaceWith(newNode);
          nodePath.skip();
          // eslint-disable-next-line no-param-reassign
          state.hasFormattedMessage = true;
          // eslint-disable-next-line no-param-reassign
          state.hasFileChange = true;
        }
      },
      StringLiteral(nodePath, state) {
        if (isIgnoreTextNode(nodePath)) {
          return;
        }
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
          const jsxComponentFunction = nodePath.findParent((item) =>
            checkJsxComponentDeclaration(item),
          ) as NodePath<
            babelTypes.ArrowFunctionExpression | babelTypes.FunctionDeclaration
          > | null;
          if (jsxComponentFunction && injectUseIntl(jsxComponentFunction)) {
            // eslint-disable-next-line no-param-reassign
            state.hasUseIntl = true;
          }
          // eslint-disable-next-line no-param-reassign
          state.hasFileChange = true;
        }
      },
      TemplateLiteral(nodePath, state) {
        if (isIgnoreTextNode(nodePath)) {
          return;
        }
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
        const jsxComponentFunction = nodePath.findParent((item) =>
          checkJsxComponentDeclaration(item),
        ) as NodePath<
          babelTypes.ArrowFunctionExpression | babelTypes.FunctionDeclaration
        > | null;
        if (jsxComponentFunction && injectUseIntl(jsxComponentFunction)) {
          // eslint-disable-next-line no-param-reassign
          state.hasUseIntl = true;
        }
        // eslint-disable-next-line no-param-reassign
        state.hasFileChange = true;
      },
    },
    undefined,
    traverseState,
  );
  return traverseState.hasFileChange;
}
