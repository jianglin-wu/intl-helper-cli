require('@babel/register');
const commander = require('commander');
const glob = require('glob');
const fse = require('fs-extra');
const path = require('path');
const { default: template } = require('@babel/template');
const parser = require('@babel/parser');
const { default: traverse } = require('@babel/traverse');
const { default: generate } = require('@babel/generator');
const babelTypes = require('@babel/types');
const appConfig = require('./package.json');

const { Command } = commander;
const program = new Command();
program.version(appConfig.version || '0.0.0', '-v, --version', '输出版本号');

function isIncludesChinese(string) {
  return /[\u4e00-\u9fa5]+/.test(string);
}

function generateLocale(texts, namespace) {
  const conf = {};
  texts.forEach((text, index) => {
    conf[`${namespace}.abc${index}`] = text;
  });
  return conf;
}

function output(data, rootPath) {
  const outputFile = path.resolve(rootPath, './locales/zh-CN.js');
  fse.outputFileSync(
    outputFile,
    `export default ${JSON.stringify(data, null, 2)}`,
  );
}

function codeParse(code) {
  return parser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    ranges: true,
  });
}

function formatTemplateTexts(texts) {
  let text;
  if (texts.length <= 2) {
    text = texts.join('{value}');
  } else {
    text = texts.reduce((str, item, index) => `${str}{value${index}}${item}`);
  }
  return text;
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

function extract(rootPath) {
  const files = glob.sync(
    '{*.{js,jsx,ts,tsx},!(node_modules|locales|output)**/*.{js,jsx,ts,tsx}}',
    {
      cwd: rootPath,
    },
  );
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
  output(data, process.cwd());
}

function injectFormatMassage(ast, localeMap) {
  const createCallNode = (id, values) => {
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

function generateCode(ast, filePath) {
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

function inject(rootPath, localeFilePath, outputPath) {
  const files = glob.sync(path.resolve(rootPath, './**/*.tsx'));
  const localeCode = fse
    .readFileSync(localeFilePath)
    .toString()
    .replace('export default ', '');
  let localeInfo = {};
  eval(`localeInfo = ${localeCode}`);
  const localeMap = {};
  Object.entries(localeInfo).forEach(
    ([key, value]) => (localeMap[value] = key),
  );
  files.forEach((filePath) => {
    if (filePath.indexOf(path.resolve(rootPath, './output')) === 0) {
      return;
    }
    console.log('filePath:', filePath);
    const code = fse.readFileSync(filePath).toString();
    const ast = codeParse(code);
    injectFormatMassage(ast, localeMap);
    const outputFile = filePath.replace(rootPath, outputPath);
    generateCode(ast, outputFile);
  });
}

program.command('extract <path>').action((targetPath) => {
  try {
    extract(path.resolve(process.cwd(), targetPath));
  } catch (error) {
    console.error('[runner] 提取内容失败：', error);
  }
});

program
  .command('inject <path>')
  .option('-o, --output <output>', 'output path', './output')
  .option('-l, --locale <locale>', 'locale file')
  .action((targetPath, { locale, output }) => {
    try {
      const rootPath = path.resolve(process.cwd(), targetPath);
      const localePath = path.resolve(process.cwd(), locale);
      const outputPath = path.resolve(process.cwd(), output);
      inject(rootPath, localePath, outputPath);
    } catch (error) {
      console.error('[runner] 内容替换失败：', error);
    }
  });

program.parse(process.argv);
