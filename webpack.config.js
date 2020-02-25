const VueLoaderPlugin = require('vue-loader/lib/plugin')
const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin') //删除原来的打包文件
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const TerserWebpackPlugin = require('terser-webpack-plugin')
const webpack = require('webpack')
const CompressionPlugin = require('compression-webpack-plugin')
// const AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin');
// const ora = require('ora')
const BASE_URL = ''

// var spinner = ora('building for ' + process.env.NODE_ENV + '...')
// spinner.start()
const ENV = {
  prod: {
    NODE_ENV: '"production"'
  },
  test: {
    NODE_ENV: '"testing"'
  }
}
const env = process.env.NODE_ENV === 'production' ? ENV.prod : ENV.test

// 复用loader
const commonCssLoader = [
  MiniCssExtractPlugin.loader,
  'css-loader',
  {
    // 还需要在package.json 中定义browserslist
    loader: 'postcss-loader',
    options: {
      ident: 'postcss',
      plugins: () => [require('postcss-preset-env')()]
    }
  }
]
const externals = {
  vue: 'Vue',
  'vue-router': 'VueRouter',
  vuex: 'Vuex',
  vant: 'vant',
  axios: 'axios'
}
// cdn
const cdn = {
  // 测试环境
  test: {
    css: [],
    js: []
  },
  // 生产/测试环境
  production: {
    css: ['//cdn.jsdelivr.net/npm/vant@beta/lib/index.css'],
    js: [
      '//cdnjs.cloudflare.com/ajax/libs/vue/2.6.10/vue.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/vue-router/3.0.6/vue-router.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/vuex/3.1.1/vuex.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/crypto-js/3.1.9-1/crypto-js.min.js',
      '//cdn.jsdelivr.net/npm/vant@beta/lib/vant.min.js'
    ]
  }
}
const WEBPACKCONFIG = {
  // 区分测试环境和生产环境
  mode: 'production',
  externals: externals,
  devtool: process.env.NODE_ENV === 'production' ? '' : 'cheap-module-eval-source-map',
  entry: './src/main.js',
  output: {
    publicPath: '', //模板、样式、脚本、图片等资源的路径中统一会加上额外的路径
    path: path.resolve(__dirname, 'dist'),
    filename: 'js/[name].[hash:8].js'
  },
  resolve: {
    extensions: ['.js', 'vue', '.json', '.jsx', '.css'],
    modules: [path.resolve('src'), path.resolve('node_modules')],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
      '@': path.resolve('src')
    },
    // 针对 Npm 中的第三方模块优先采用 jsnext:main 中指向的 ES6 模块化语法的文件
    mainFields: ['jsnext:main', 'browser', 'main']
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        include: [path.resolve('src')],
        loader: 'babel-loader',
        options: {
          presets: [
            [
              '@babel/preset-env',
              {
                // 按需加载
                useBuiltIns: 'usage',
                // 指定core-js 版本
                corejs: {
                  version: 3
                },
                // 指定兼容性做到哪个版本浏览器
                targets: {
                  chrome: '60',
                  firefox: '60',
                  ie: '9',
                  safari: '10',
                  edge: '17'
                }
              }
            ]
          ],
          cacheDirectory: true
        }
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        include: [path.resolve('src'), path.resolve('node_modules/vue-easytable/libs')],
        exclude: /node_modules\/(?!(autotrack|dom-utils))|vendor\.dll\.js/
      },
      {
        test: /\.(css|scss|sass)$/,
        use: [...commonCssLoader, 'sass-loader']
      },
      {
        // 问题：默认处理不了html 中img 图片
        // 处理图片资源
        test: /\.(jpg|png|gif)$/,
        // 使用一个loader
        // 下载url-loader file-loader
        loader: 'url-loader',
        options: {
          // 图片大小小于8kb，就会被base64 处理
          // 优点: 减少请求数量（减轻服务器压力）
          // 缺点：图片体积会更大（文件请求速度更慢）
          limit: 5 * 1024,
          // 问题：因为url-loader 默认使用es6 模块化解析，而html-loader 引入图片是commonjs
          // 解析时会出问题：[object Module]
          // 解决：关闭url-loader 的es6 模块化，使用commonjs 解析
          esModule: false,
          // 给图片进行重命名
          // [hash:10]取图片的hash 的前10 位
          // [ext]取文件原来扩展名
          name: '[hash:10].[ext]',
          outputPath: 'img/'
        }
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: 'fonts/[name].[hash:8].[ext]',
              outputPath: 'file'
            }
          }
        ]
      }
    ]
  },
  /*
  1. 可以将node_modules 中代码单独打包一个chunk 最终输出
  2. 自动分析多入口chunk 中，有没有公共的文件。如果有会打包成单独一个chunk
  */
  optimization: {
    splitChunks: {
      chunks: 'all'
    },
    // 将当前模块的记录其他模块的hash单独打包为一个文件 runtime
    // 解决：修改a文件导致b文件的contenthash变化
    runtimeChunk: {
      name: entrypoint => `runtime-${entrypoint.name}`
    },
    minimize: true,
    minimizer: [
      // 配置生产环境的压缩方案：js 和css
      new TerserWebpackPlugin({
        // 开启缓存
        cache: true,
        // 开启多进程打包
        parallel: true,
        // 启动source-map
        sourceMap: false,
        terserOptions: {
          warnings: false, // 清除警告
          compress: {
            drop_debugger: true, // 清除degugger
            drop_console: true // 清除所有的console信息
          }
        }
      })
    ]
  },
  plugins: [
    // 设置环境变量信息
    new webpack.DefinePlugin({
      'process.env': env
    }),
    new CleanWebpackPlugin(), //删除上次打包文件，默认目录'./dist'
    new MiniCssExtractPlugin({
      // 对输出的css 文件进行重命名
      filename: 'css/[name].[contenthash].css'
    }),
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      title: 'webpack demo',
      favicon: './public/favicon.ico', //图标
      template: './public/index.html', //指定要打包的html
      url: BASE_URL,
      cdn: cdn.production,
      filename: 'index.html', //指定输出路径和文件名
      minify: {
        //压缩
        removeComments: true, //移除HTML中的注释
        collapseWhitespace: true, //删除空白符与换行符
        removeAttributeQuotes: true //去除属性引用
      }
    }),
    // 压缩css
    new OptimizeCssAssetsWebpackPlugin(),
    new CompressionPlugin({
      filename: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp('\\.(' + ['js', 'css'].join('|') + ')$'),
      threshold: 10240,
      minRatio: 0.8
    }),

    // 开启 Scope Hoisting 功能
    new webpack.optimize.ModuleConcatenationPlugin()
  ],
  performance: {
    //  webpack 的性能提示
    hints: 'warning', // 显示警告信息
    maxEntrypointSize: 5 * 1024 * 1024, // 设置入口文件的最大体积为5M  （以字节为单位）
    maxAssetSize: 20 * 1024 * 1024, // 设置输出文件的最大体积为20M  （以字节为单位）
    assetFilter(assetFilename) {
      // 提供资源文件名的断言函数
      return assetFilename.endsWith('.js') || assetFilename.endsWith('.css')
    }
  }
}
if (process.env.NODE_ENV === 'report') {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

  WEBPACKCONFIG.plugins.push(
    new BundleAnalyzerPlugin({
      analyzerMode: 'server',
      analyzerHost: '127.0.0.1',
      analyzerPort: 8889,
      reportFilename: 'report.html',
      defaultSizes: 'parsed',
      openAnalyzer: true,
      generateStatsFile: false,
      statsFilename: 'stats.json',
      statsOptions: null,
      logLevel: 'info'
    })
  )
}

module.exports = WEBPACKCONFIG
