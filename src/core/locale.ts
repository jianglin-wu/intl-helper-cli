import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import traverse from '@babel/traverse';
import * as babelTypes from '@babel/types';
import { codeParse, generateCode } from './common';
import { ILocaleData } from '../interface';

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
            console.log('存在冲突字段：', key);
            // eslint-disable-next-line no-console
            console.log(
              `已有属性值 "${existed[key]}" 与新增属性值 "${value}" 冲突，已忽略此内容。\n`,
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

export function generateLocaleCode(
  data: ILocaleData,
  rootPath: string,
  outputFile?: string,
) {
  let localeCode = 'export default {}';
  const outputPath = outputFile ? path.resolve(rootPath, outputFile) : '';
  if (outputFile && fs.existsSync(outputPath)) {
    localeCode = fse.readFileSync(outputPath).toString();
  }
  return appendLocaleData(localeCode, data);
}
