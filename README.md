<p align="center">
<img src="https://docs.rsshub.app/img/logo.png" width="100">
</p>
本项目采用Vite+React+Sass构建，基于Taro框架
## 部署教程
```sh
#克隆项目
git clone https://gitee.com/damn_2/taro_mini.git

cd taro_mini/

#下载依赖
npm install
#如果报错，显示依赖冲突，使用
npm install --legacy-peer-deps
```
## 构建
- dev 模式（增加 --watch 参数） 将会监听文件修改。
- build 模式（去掉 --watch 参数） 将不会监听文件修改，并会对代码进行压缩打包。
开发环境(dev)
```sh
#网页端,支持热重载，修改代码，网页自动更新
npm run dev:h5

#微信小程序，支持热重载
npm run dev:weapp
```
生产环境(build)
```sh
# pnpm
$ pnpm dev:weapp
$ pnpm build:weapp

# yarn
$ yarn dev:weapp
$ yarn build:weapp

# npm script
$ npm run dev:weapp
$ npm run build:weapp
$ taro build --type weapp --watch
$ taro build --type weapp

$ npx taro build --type weapp --watch
$ npx taro build --type weapp

# watch 同时开启压缩
#cmd
NODE_ENV=production && taro build --type weapp --watch 

#bash
NODE_ENV=production taro build --type weapp --watch # Bash
```
### 小程序开发者工具
下载并打开微信开发者工具，然后选择项目根目录进行预览。

需要注意开发者工具的项目设置：

- 需要设置关闭 ES6 转 ES5 功能，开启可能报错
- 需要设置关闭上传代码时样式自动补全，开启可能报错
- 需要设置关闭代码压缩上传，开启可能报错

[Taro官网](https://docs.taro.zone/docs/)