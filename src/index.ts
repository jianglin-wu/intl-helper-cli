import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import {
  codeParse,
  getNamespace,
  createLocale,
  generateCode,
} from './core/common';
import { collectText } from './core/extract';
import { injectFormatMassage, readLocaleData } from './core/inject';
import Translate from './translate';
import { ILocaleData } from './interface';
import {
  findFiles,
  isIncludesChinese,
  generateLocaleFile,
  formatEn,
} from './utils';

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

  extract(targetDir: string, outputFile?: string) {
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
    generateLocaleFile(this.rootPath, data, outputFile);
  }

  inject(targetDir: string, localeFile: string, outputDir?: string) {
    const targetPath = this.resolve(targetDir, true);
    const localeFilePath = this.resolve(localeFile, true);
    const files = findFiles(targetPath);
    const localeData = readLocaleData(localeFilePath);

    const localeMap: ILocaleData = {};
    Object.entries(localeData).forEach(([key, value]) => {
      localeMap[value] = key;
    });

    files.forEach((filePath) => {
      // eslint-disable-next-line no-console
      console.log('filePath:', filePath);
      const code: string = fse
        .readFileSync(path.resolve(targetPath, filePath))
        .toString();
      const ast = codeParse(code);
      injectFormatMassage(ast, localeMap);
      if (outputDir) {
        const outputDirPath = this.resolve(outputDir, false);
        generateCode(ast, path.resolve(outputDirPath, filePath));
      } else {
        generateCode(ast);
      }
    });
  }

  async translate(localeFile: string, outputFile?: string) {
    const localeFilePath = this.resolve(localeFile, true);
    if (!this.translateService) {
      throw Error('请配置翻译服务 appId 和 appKey');
    }
    const dataSource: ILocaleData = readLocaleData(localeFilePath);
    const query = Object.values(dataSource);
    // 过滤掉模板字符串
    // const query = Object.values(dataSource).filter(
    //   (item) => !/[\{.*?\}|\n]/.test(item),
    // );
    const { trans_result: transResult } = await this.translateService.fetch(
      query.join('\n'),
    );

    const dataTranslate: ILocaleData = {};
    transResult.forEach((item) => {
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

    const outputFilePath = outputFile
      ? this.resolve(outputFile, false)
      : undefined;
    generateLocaleFile(this.rootPath, result, outputFilePath);
  }

  async replaceContent(targetDir: string, outputDir: string) {
    const outputDirPath = this.resolve(outputDir, false);
    const localesZhPath = path.resolve(outputDirPath, './locales/zh-CN.ts');
    const localesEnPath = path.resolve(outputDirPath, './locales/en-US.ts');
    this.extract(targetDir, localesZhPath);
    await this.translate(localesZhPath, localesEnPath);
    this.inject(targetDir, localesZhPath, outputDirPath);
  }
}

export default IntlHelper;
