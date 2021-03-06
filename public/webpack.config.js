"use strict"

const path = require("path")
const webpack = require("webpack")
const FailPlugin = require("webpack-fail-plugin")

const CleanPlugin = require("./webpack/plugins/CleanPlugin")
const GzipPlugin = require("./webpack/plugins/GzipPlugin")
const RevPlugin = require("./webpack/plugins/RevPlugin")
const Loaders = require("./webpack/Loaders")

// A webpack config abstraction
class WebpackConfig {
  constructor() {
    this.absoluteRoot = __dirname

    this.IS_DEVELOP = !process.env.WEBPACK_PROD

    this.shouldOptimize =
      process.env.WEBPACK_PROD &&
      ["develop", "master"].indexOf(process.env.BRANCH_NAME) >= 0
    if (this.shouldOptimize) {
      console.log(
        `Running optimizations due to branch: ${process.env.BRANCH_NAME}`
      ) // eslint-disable-line
    }
  }

  get mode() {
    return this.shouldOptimize ? "production" : "development"
  }

  get resolve() {
    return {
      extensions: [".js", ".json"],
    }
  }

  get entry() {
    return {
      app: path.join(this.absoluteRoot, "src", "app"),
    }
  }

  get output() {
    return {
      filename: "app-[hash]" + (this.IS_DEVELOP ? "" : ".min") + ".js",
      path: path.join(this.absoluteRoot, "build"),
      publicPath: "./",
    }
  }

  get plugins() {
    let plugins = []
    const pluginList = this.pluginList
    for (var i = 0; i < pluginList.length; i++) {
      if (pluginList[i]) {
        plugins.push(pluginList[i])
      }
    }
    if (this.shouldOptimize) {
      plugins = plugins.concat(this.prodPlugins)
    }
    return plugins
  }

  get pluginList() {
    return [
      this.cleanPlugin,
      this.failPlugin,
      this.revPlugin,
      this.definePlugin,
    ]
  }

  get prodPlugins() {
    return [new GzipPlugin()]
  }

  get cleanPlugin() {
    return new CleanPlugin(path.join(this.absoluteRoot, "build"))
  }

  get failPlugin() {
    return FailPlugin
  }

  get revPlugin() {
    return new RevPlugin({
      path: path.join(this.absoluteRoot, "./build/stats.json"),
      notifyTitle: this.app,
    })
  }

  get definePlugin() {
    if (this.shouldOptimize) {
      const DEFINE_PROD_ENV = {
        "process.env": {
          NODE_ENV: '"production"',
        },
      }

      return new webpack.DefinePlugin(DEFINE_PROD_ENV)
    } else {
      // Always expose NODE_ENV to webpack, in order to use `process.env.NODE_ENV`
      // inside your code for any environment checks; UglifyJS will automatically
      // drop any unreachable code.
      return new webpack.DefinePlugin({
        "process.env": {
          NODE_ENV: JSON.stringify(process.env.NODE_ENV),
        },
      })
    }
  }

  get devtool() {
    return this.IS_DEVELOP ? "eval" : "source-map"
  }

  get node() {
    // Some node_modules pull in Node-specific dependencies.
    // Since we're running in a browser we have to stub them out. See:
    // https://webpack.github.io/docs/configuration.html#node
    // https://github.com/webpack/node-libs-browser/tree/master/mock
    // https://github.com/webpack/jade-loader/issues/8#issuecomment-55568520
    return {
      fs: "empty",
      child_process: "empty",
      net: "empty",
      tls: "empty",
    }
  }

  get module() {
    return {
      rules: this.loaders,
    }
  }

  get loaders() {
    let loaders = []
    const loaderList = this.loaderList
    for (var i = 0; i < loaderList.length; i++) {
      if (loaderList[i]) {
        loaders.push(loaderList[i].toJSON())
      }
    }
    return loaders
  }

  get loaderList() {
    return [
      this.javascriptLoader,
      this.lessLoader,
      this.jsonLoader,
      this.assetLoader,
    ]
  }

  get javascriptLoader() {
    return new Loaders.JavascriptLoader()
  }

  get lessLoader() {
    return new Loaders.LessLoader()
  }

  get jsonLoader() {
    return new Loaders.JSONLoader()
  }

  get assetLoader() {
    return new Loaders.AssetLoader()
  }

  toJSON() {
    let json = {
      mode: this.mode,
      entry: this.entry,
      output: this.output,
      resolve: this.resolve,
      plugins: this.plugins,
      devtool: this.devtool,
      node: this.node,
      module: this.module,
    }

    return json
  }
}

const config = new WebpackConfig()
module.exports = config.toJSON()
