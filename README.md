# 国际化多语言助手

## 介绍
国际化多语言支持的时候，我们需要不断重复的复制粘贴替换代码，需要较大的体力成本。此工具协助开发者来减少这部分体力消耗（目前只支持 react umi 项目）。

### 常规的前端国际化处理

使用 react-intl 这个依赖，在项目 locales 目录中同时维护多套语言。业务代码中展示的内容需要调用 `formatMessage` 函数或 `FormattedMessage` 组件并且指定 id 内容标识。最后，根据用户需要展示的语言，react-intl 内部根据 Context 特性计算出具体的内容。

#### 解决什么问题

将已有项目更改为支持多语言时，我们通常需要不断重复以下动作（以：中文项目支持英文项目为例）：

1. 从业务代码中找出所有展示的中文，复制到 `locales/zh-CN.ts` 组成一个大的 key 和 value 的对象（不断重复此操作）。
2. 拷贝每一个中文，找出对应的英文编写到 `locales/en-US.ts` 中，可能是文档里也可能直接翻译（不断重复此操作）
3. 找出项目中的中文，替换为 `formatMessage` 函数或 `FormattedMessage` 组件（不断重复此操作）


#### 解决方案

方式一：
最新的语言国际化工作流。

https://formatjs.io/docs/getting-started/application-workflow

方式二：
如何项目老旧不易升级，使用本项目提供的助手工具，来完成以下三部分工作：

1. 将项目中所以出现的中文提取去重，自动生成 `locales/zh-CN.ts` 文件。
2. 调用翻译接口，翻译 `locales/zh-CN.ts` 中的内容生成到 `locales/en-US.ts` 中。
3. 读取 `locales/zh-CN.ts` 文件，将业务代码中相同文本的地方替换为 `formatMessage` 函数或 `FormattedMessage` 组件，并通过 `id` 关联翻译信息。

## 使用
### 提取中文

执行 `intl-helper-cli extract <path>` 命令，将项目中所以出现的中文提取去重，自动生成 `locales/zh-CN.ts` 文件。

- path 参数：指定提取的路径
- 注意：locales 文件夹会生成到执行命令的 cwd 路径下。

例如（执行前确保无其他代码修改，以免丢失代码）：

```shell
$ intl-helper-cli extract ./test/scene1 -o ./output/locales/zh-CN.ts
```

### 翻译文本

执行 `intl-helper-cli translate --appid <appid> --key <key> <localesPath> -o <outputFilePath>` 命令，翻译 `zh-CN.ts` 中的内容生成 `en-US.ts` 文件。此处的 `<appid>` 和 `<key>` 需要替换成[百度翻译 API](https://fanyi-api.baidu.com/product/113) 申请的 appId 和 appKey。

例如（执行前确保无其他代码修改，以免丢失代码）：

```shell
$ intl-helper-cli translate  --appid <appid> --key <key> ./output/locales/zh-CN.ts -o ./output/locales/en-US.ts
```

### 替换代码

执行 `intl-helper-cli inject <path> -l <localesPath> -o <outputPath>` 命令，，读取 `locales/zh-CN.ts` 文件，将业务代码中相同文本的地方自动替换为 `formatMessage` 函数或 `FormattedMessage` 组件。

- path 参数：指定要读取的代码路径。
- localesPath 参数：指定语言配置文件的路径。
- outputPath 参数：指定内容替换后文件输出路径，和读取代码路径一致可以原地替换。

例如（执行前确保无其他代码修改，以免丢失代码）：

```shell
$ intl-helper-cli inject ./test/scene1 -f ./output/locales/zh-CN.ts -o ./output
```

### 自动翻译

执行 `intl-helper-cli danger  --appid <appid> --key <key> <targetDir> -o <outputDir>` 命令，此命令相当于将 `extract`, `translate`, `inject` 三个命令按顺序一起执行。

例如（执行前确保无其他代码修改，以免丢失代码）：

```shell
$ intl-helper-cli danger  --appid <appid> --key <key> ./test/scene1 -o ./output
```

## 其他

### 代码格式化

命令行执行完后，代码格式可能会错乱，需要格式美化一下代码。

```shell
$ npx prettier --write ./src/pages/xxx/**/*.tsx
```
