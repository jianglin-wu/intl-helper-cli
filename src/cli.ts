import commander from 'commander';
import IntlHelper from './index';
import appConfig from '../package.json';

const { Command } = commander;

const program = new Command();
program.version(appConfig.version || '0.0.0', '-v, --version', '输出版本号');

program
  .command('extract <targetDir>')
  .option('-o, --output <output>', 'output file')
  .action((targetDir: string, { output }) => {
    try {
      const app = new IntlHelper(process.cwd());
      app.extract(targetDir, output);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[runner] 提取内容失败：', error);
    }
  });

program
  .command('inject <targetDir>')
  .option('-f, --file <file>', 'locale file', './locales/zh-CN.js')
  .option('-o, --output <output>', 'output dir')
  .action((targetDir, { file, output }) => {
    try {
      const app = new IntlHelper(process.cwd());
      app.inject(targetDir, file, output);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[runner] 内容替换失败：', error);
    }
  });

program
  .command('translate <localeFile>')
  .option('-o, --output <output>', 'output path')
  .option('--appid <appid>', '翻译 api appId')
  .option('--key <key>', '翻译 api appKey')
  .action((localeFile, { output, appid, key }) => {
    try {
      if (!appid || !key) {
        throw Error('请传入 --appid <appid> 和 --key <key> 参数');
      }
      const app = new IntlHelper(process.cwd(), {
        baiduAppId: appid,
        baiduAppKey: key,
      });
      app.translate(localeFile, output);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[runner] 内容翻译失败：', error);
    }
  });

program
  .command('danger <targetDir>')
  .option('-o, --output <output>', 'output dir', './output')
  .option('--appid <appid>', '翻译 api appId')
  .option('--key <key>', '翻译 api appKey')
  .action((targetDir, { output, appid, key }) => {
    try {
      if (!appid || !key) {
        throw Error('请传入 --appid <appid> 和 --key <key> 参数');
      }
      const app = new IntlHelper(process.cwd(), {
        baiduAppId: appid,
        baiduAppKey: key,
      });
      app.replaceContent(targetDir, output);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[runner] 内容翻译失败：', error);
    }
  });

// TODO:
// 待翻译内容地图（可以指定展示层级，类似 tree -L 3）
// 加载已有翻译内容（递归分析合并的配置，将 ... 扩展运算符的内容一起合并）
// 为已有的翻译内容增加 defaultMessage
// 为英文内容增加中文注释
// prettier code

program.parse(process.argv);
