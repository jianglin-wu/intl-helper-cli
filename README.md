# 国际化多语言助手

## 介绍
国际化多语言支持的时候，需要不断重复的复制粘贴替换代码，需要较大的体力成本。此工具协助开发者来减少这部分无脑力的体力消耗（目前只支持 react 项目）。

### 常规的前端国际化处理

使用 react-intl 这个依赖，在项目 locales 目录中同时维护多套语言。业务代码中展示的内容需要调用 `formatMessage` 函数或 `FormattedMessage` 组件并且指定 id 内容标识。最后，根据用户需要展示的语言，react-intl 内部根据 Context 特性计算出具体的内容。

#### 痛点

将已有项目更改为支持多语言时，我们通常需要不断重复以下动作（以：中文项目支持英文项目为例）：

1. 从业务代码中找出所有展示的中文，复制到 `locales/zh-CN.js` 组成一个大的 key 和 value 的对象（可能需要拷贝几百上千次）。
2. 拷贝每一个中文，找出对应的英文编写到 `locales/en-US.js` 中，可能是文档里也可能直接翻译（可能需要拷贝几百上千次）
3. 找出项目中的中文，替换为 `formatMessage` 函数或 `FormattedMessage` 组件（可能需要拷贝几百上千次）


#### 解决方案

方式一：
最新的语言国际化工作流。

https://formatjs.io/docs/getting-started/application-workflow


方式二：
如何项目老旧不易升级，使用本项目提供的助手工具，可以减少三分之二的体力工作：

1. 执行 `intl-helper-cli extract ...` 命令，将项目中所以出现的中文提取去重，自动生成 `locales/zh-CN.js` 文件。
2. 中文翻译英文的步骤还是跟之前保持一致，需要手动翻译（可能需要拷贝几百上千次）。
3. 执行 `intl-helper-cli inject ...` 命令，读取 `locales/zh-CN.js` 文件，将业务代码中相同文本的地方自动替换为 `formatMessage` 函数或 `FormattedMessage` 组件。

## 使用
### 提取
执行 `intl-helper-cli extract <path>` 命令，将项目中所以出现的中文提取去重，自动生成 `locales/zh-CN.js` 文件。

- path 参数：指定提取的路径
- 注意：locales 文件夹会生成到执行命令的 cwd 路径下。

执行参数自行指定：
```shell
$ intl-helper-cli extract ./test
```

### 替换

执行 `intl-helper-cli inject <path> -l <localesPath> -o <outputPath>` 命令，，读取 `locales/zh-CN.js` 文件，将业务代码中相同文本的地方自动替换为 `formatMessage` 函数或 `FormattedMessage` 组件。

- path 参数：指定要读取的代码路径。
- localesPath 参数：指定语言配置文件的路径。
- outputPath 参数：指定内容替换后文件输出路径，和读取代码路径一致可以原地替换。

执行前确保无其他代码修改，以免丢失代码，执行参数自行指定：

```shell
$ intl-helper-cli inject ./ -l ./locales/zh-CN.js -o ./
```

### 代码格式化

命令行执行完后，代码格式可能会错乱，需要格式美化一下代码。

```shell
$ npx prettier --write ./src/pages/xxx/**/*.tsx
```
