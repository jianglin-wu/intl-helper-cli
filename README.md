# 国际化助手

## 使用

### 提取
执行参数自行指定：
```shell
$ intl-helper-cli extract ./test
```

### 替换

执行前确保无其他代码修改，以免丢失代码，执行参数自行指定：
```shell
$ intl-helper-cli inject ./ -l ./locales/zh-CN.js -o ./
```

### 代码格式化

命令行执行完后，再格式化一下代码。

```shell
$ npx prettier --write ./src/pages/s-screen/**/*.tsx
```
