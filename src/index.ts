import path from 'path';
import commander from "commander";
import extract from './extract';
import inject from './inject';
import appConfig from '../package.json';

const { Command } = commander;
const program = new Command();

program.version(appConfig.version || '0.0.0', '-v, --version', '输出版本号');

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
