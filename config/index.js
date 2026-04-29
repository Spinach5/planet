import { defineConfig } from '@tarojs/cli'
import devConfig from './dev'
import prodConfig from './prod'

export default defineConfig(async (merge, { command, mode }) => {
  const baseConfig = {
    projectName: 'zqw',
    date: '2026-4-27',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: [
      "@tarojs/plugin-generator",
    ],
    defineConstants: {
    },
    copy: {
      patterns: [],
      options: {}
    },
    framework: 'react',
    compiler: 'vite',
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      // ✅ 添加代理配置
      devServer: {
        port: 10086,
        proxy: {
          '/chaoxing': {
            target: 'https://passport2-static.chaoxing.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/chaoxing/, '')
          },
          '/api-passport': {
            target: 'https://passport2.chaoxing.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-passport/, '')
          },
          '/api-hbut': {
            target: 'https://hbut.jw.chaoxing.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-hbut/, '')
          },
          '/api-vkb': {
            target: 'https://vkb.jw.chaoxing.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-vkb/, '')
          },
          '/api-i': {
            target: 'https://i.chaoxing.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-i/, '')
          }
        }
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css'
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {}
        },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]'
          }
        }
      }
    },
    rn: {
      appName: 'taroDemo',
      postcss: {
        cssModules: {
          enable: false,
        }
      }
    }
  }

  process.env.BROWSERSLIST_ENV = process.env.NODE_ENV

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig)
  }
  return merge({}, baseConfig, prodConfig)
})