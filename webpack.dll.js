const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'production',
  entry: {
    vue: ['Vue']
  },
  output: {
    path: path.resolve(__dirname, 'dll'),
    filename: '[name].js',
    library: '[name]_[hash]' // vendor.dll.js中暴露出的全局变量名
  },
  plugins: [
    new webpack.DllPlugin({
      path: path.resolve(__dirname, '.', 'dll/manifest.json'),
      name: '[name]_library'
    })
  ]
}
