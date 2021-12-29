import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import {
  codeParse,
  getNamespace,
  createLocale,
  generateCode,
  codeFormat,
} from './core/common';
import { collectText } from './core/extract';
import { injectFormatMassage } from './core/inject';
import { readLocaleData, generateLocaleCode } from './core/locale';
import Translate from './translate';
import { ILocaleData } from './interface';
import { findFiles, isIncludesChinese, formatEn } from './utils';

interface Options {
  baiduAppId?: string;
  baiduAppKey?: string;
}

class IntlHelper {
  private rootPath: string;

  private translateService?: Translate;

  constructor(rootPath: string, options: Options = {}) {
    this.rootPath = rootPath;
    const { baiduAppId, baiduAppKey } = options;
    if (baiduAppId && baiduAppKey) {
      this.translateService = new Translate(baiduAppId, baiduAppKey);
    }
  }

  resolve(pathname: string, assertExists: boolean = false) {
    const fileOrDirPath = path.resolve(this.rootPath, pathname);
    if (assertExists && !fs.existsSync(pathname)) {
      throw new Error(`${pathname} 文件或目录不存在`);
    }
    return fileOrDirPath;
  }

  async outputData(data: string, outputDirOrFile?: string, filepath?: string) {
    if (outputDirOrFile) {
      let outputPath = path.resolve(this.rootPath, outputDirOrFile);
      if (filepath) {
        outputPath = path.resolve(outputPath, filepath);
      }
      const result = await codeFormat(data, outputPath);
      fse.outputFileSync(outputPath, result);
    } else {
      // eslint-disable-next-line no-console
      console.log('\n----------', filepath || 'output', '---------->\n');
      const result = await codeFormat(data);
      // eslint-disable-next-line no-console
      console.log(result);
    }
  }

  async extract(targetDir: string, outputFile?: string) {
    // eslint-disable-next-line no-console
    console.log('\x1B[36m\nextract:\n\x1B[0m');
    const targetPath = this.resolve(targetDir, true);
    const files = findFiles(targetPath);
    const texts = new Set<string>();

    files.forEach((filePath) => {
      // eslint-disable-next-line no-console
      console.log('filePath:', filePath);
      const code = fse
        .readFileSync(path.resolve(targetPath, filePath))
        .toString();
      const ast = codeParse(code);
      collectText(ast, (text: string) => {
        if (text !== '' && isIncludesChinese(text)) {
          texts.add(text);
        }
      });
    });

    const namespace = getNamespace(targetPath);
    const data = createLocale(namespace, [...texts]);
    await this.outputData(
      generateLocaleCode(data, this.rootPath, outputFile),
      outputFile,
    );
  }

  async inject(targetDir: string, localeFile: string, outputDir?: string) {
    // eslint-disable-next-line no-console
    console.log('\x1B[36m\ninject:\n\x1B[0m');
    const targetPath = this.resolve(targetDir, true);
    const localeFilePath = this.resolve(localeFile, true);
    const files = findFiles(targetPath);
    const localeCode = fse.readFileSync(localeFilePath).toString();
    const localeData = readLocaleData(localeCode);

    const localeMap: ILocaleData = {};
    Object.entries(localeData).forEach(([key, value]) => {
      localeMap[value] = key;
    });

    return Promise.all(
      files.map(async (filePath) => {
        // eslint-disable-next-line no-console
        console.log('filePath:', filePath);
        const code: string = fse
          .readFileSync(path.resolve(targetPath, filePath))
          .toString();
        const ast = codeParse(code);
        const hasContentChange = injectFormatMassage(ast, localeMap);
        if (hasContentChange) {
          return this.outputData(generateCode(ast), outputDir, filePath);
        }
        return null;
      }),
    );
  }

  async translate(localeFile: string, outputFile?: string) {
    // eslint-disable-next-line no-console
    console.log('\x1B[36m\ntranslate:\n\x1B[0m');
    const localeFilePath = this.resolve(localeFile, true);
    if (!this.translateService) {
      throw Error('请配置翻译服务 appId 和 appKey');
    }
    const localeCode = fse.readFileSync(localeFilePath).toString();
    const dataSource: ILocaleData = readLocaleData(localeCode);
    const query = Object.values(dataSource);
    // 过滤掉模板字符串
    // const query = Object.values(dataSource).filter(
    //   (item) => !/[\{.*?\}|\n]/.test(item),
    // );
    const transResult = await this.translateService.fetch(query);
    const dataTranslate: ILocaleData = {};
    transResult.forEach((item) => {
      // console.log('transResult.item>>', item);
      dataTranslate[item.src] = item.dst;
    });

    const result: ILocaleData = {};
    Object.keys(dataSource).forEach((key) => {
      if (dataTranslate[dataSource[key]]) {
        result[key] = formatEn(dataTranslate[dataSource[key]]);
      } else {
        result[key] = dataSource[key];
      }
    });

    await this.outputData(
      generateLocaleCode(result, this.rootPath, outputFile),
      outputFile,
    );
  }

  async replaceContent(targetDir: string, outputDir: string) {
    const outputDirPath = this.resolve(outputDir, false);
    const localesZhPath = path.resolve(outputDirPath, './locales/zh-CN.ts');
    const localesEnPath = path.resolve(outputDirPath, './locales/en-US.ts');
    await this.extract(targetDir, localesZhPath);
    await this.translate(localesZhPath, localesEnPath);
    await this.inject(targetDir, localesZhPath, outputDirPath);
  }
}

export default IntlHelper;
