'use strict';

const webpack = require('webpack');
const fs      = require('fs');

const OccurenceOrderPlugin = require('webpack/lib/optimize/OccurenceOrderPlugin');
const DedupePlugin         = require('webpack/lib/optimize/DedupePlugin');
const UglifyJsPlugin       = require('webpack/lib/optimize/UglifyJsPlugin');
// const CommonsChunkPlugin   = require('webpack/lib/optimize/CommonsChunkPlugin');
const CompressionPlugin    = require('compression-webpack-plugin');
const CopyWebpackPlugin    = require('copy-webpack-plugin');
const WebpackMd5Hash       = require('webpack-md5-hash');

// constants
const constants          = require('./constants');
const DefinePlugin       = webpack.DefinePlugin;
const DllPlugin          = webpack.DllPlugin;
const DllReferencePlugin = webpack.DllReferencePlugin;

const ENV = process.env.NODE_ENV = process.env.ENV = 'production';

const ROOT_DIR    = constants.ROOT_DIR;
const SRC_DIR     = constants.SRC_DIR;
const PUBLIC_DIR  = constants.PUBLIC_DIR;
const PRIVATE_DIR = constants.PRIVATE_DIR;

const SOURCE_MAPS = constants.SOURCE_MAPS;

const VENDOR_NAME     = constants.VENDOR_NAME;
const BROWSER_NAME    = constants.BROWSER_NAME;
const WORKER_NAME     = constants.WORKER_NAME;
const WORKER_APP_NAME = constants.WORKER_APP_NAME;
const SERVER_NAME     = constants.SERVER_NAME;

const SERVER_SOURCE_PATH     = constants.SERVER_SOURCE_PATH;
const BROWSER_SOURCE_PATH    = constants.BROWSER_SOURCE_PATH;
const WORKER_SOURCE_PATH     = constants.WORKER_SOURCE_PATH;
const WORKER_APP_SOURCE_PATH = constants.WORKER_APP_SOURCE_PATH;

const VENDOR_DLL_MANIFEST_FILE = constants.VENDOR_DLL_MANIFEST_FILE;
const VENDOR_DLL_MANIFEST_PATH = constants.VENDOR_DLL_MANIFEST_PATH;

const NODE_MODULES = fs.readdirSync(ROOT_DIR + '/node_modules').filter(function(name) {
  return name !== '.bin';
});

const STATS_OPTIONS = {
  colors: {
    level: 2,
    hasBasic: true,
    has256: true,
    has16m: false
  },
  cached: false,
  cachedAssets: false,
  modules: true,
  chunks: false,
  reasons: false,
  errorDetails: false,
  chunkOrigins: false,
  exclude: ['node_modules']
};

// plugins
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const ENV_PLUGIN = new DefinePlugin({
  'process.env': {
    'ENV': JSON.stringify(ENV),
    'NODE_ENV': JSON.stringify(ENV)
  }
});

const DEFINE_CONSTANTS_PLUGIN = new DefinePlugin((function stringifyConstants() {
  const stringifiedConstants = {};

  Object.keys(constants).forEach(function(constantName) {
    stringifiedConstants[constantName] = JSON.stringify(constants[constantName]);
  });

  return stringifiedConstants;
})());

const VENDOR_DLL_REFERENCE_PLUGIN = new DllReferencePlugin({
  context: ROOT_DIR,
  sourceType: 'var',
  get manifest() {
    return require(VENDOR_DLL_MANIFEST_PATH);
  }
});

const EXTRACT_TEXT_PLUGIN = new ExtractTextPlugin('styles.css');

const IGNORE_MODULES_PLUGIN = new webpack.IgnorePlugin(/\.jpe?g$|\.gif$|\.png$|\.woff(2)?(\?v=\d+\.\d+\.\d+)?$|\.ttf(\?v=\d+\.\d+\.\d+)?$|\.eot(\?v=\d+\.\d+\.\d+)?$|\.svg(\?v=\d+\.\d+\.\d+)?$|\.less$/)

const MD5_HASH_PLUGIN = new WebpackMd5Hash();

const DEDUPE_PLUGIN = new DedupePlugin();

const OCCURENCE_ORDER_PLUGIN = new OccurenceOrderPlugin(true);

const COPY_ASSETS_PLUGIN = new CopyWebpackPlugin([
  {
    from: SRC_DIR + '/assets',
    to: 'assets'
  },
]);
const COPY_CONFIG_PLUGIN = new CopyWebpackPlugin([
  {
    from: ROOT_DIR + '/constants.js',
    to: 'constants.js'
  },
]);
const COPY_SERVE_PLUGIN = new CopyWebpackPlugin([
  {
    from: SRC_DIR + '/server/serve.js',
    to: 'serve.js'
  },
]);
// const COMMONS_CHUNKS_PLUGIN = new CommonsChunkPlugin({
//       name: 'polyfills',
//       filename: 'polyfills.[chunkhash].bundle.js',
//       chunks: Infinity
//     });
//
const UGLIFY_JS_PLUGIN = new UglifyJsPlugin({
      // to debug prod builds uncomment //debug lines and comment //prod lines

      // beautify: true,//debug
      // mangle: false,//debug
      // dead_code: false,//debug
      // unused: false,//debug
      // deadCode: false,//debug
      // compress : { screw_ie8 : true, keep_fnames: true, drop_debugger: false, dead_code: false, unused: false, }, // debug
      // comments: true,//debug

      beautify: false,//prod
      // disable mangling because of a bug in angular2
      // TODO: enable mangling as soon as it works
      // mangle: { screw_ie8 : true },//prod
      mangle: false,
      compress : { screw_ie8 : true},//prod
      comments: false//prod
    });

const COMPRESSION_PLUGIN = new CompressionPlugin({
      algorithm: 'gzip',
      regExp: /\.css$|\.html$|\.js$|\.map$/,
      threshold: 2 * 1024
    });

// loaders
const LOADERS = [
  {
    test: /\.ts$/,
    loader: 'ts',
    query: {
      ignoreDiagnostics: [
        2403, // 2403 -> Subsequent variable declarations
        2300, // 2300 -> Duplicate identifier
        2374, // 2374 -> Duplicate number index signature
        2375, // 2375 -> Duplicate string index signature
      ]
    },
    exclude: [
      /node_modules/
    ]
  },
  {
    test: /\.html$/,
    loader: 'raw'
  },
  {
    test: /\.css$/,
    loaders: ['raw', 'postcss']
  },
  {
    test: /\.json$/,
    loader: 'json'
  },
];

const BROWSER_LOADERS = [
  ...LOADERS,
  {
    test: /\.woff(2)?(\?v=\d+\.\d+\.\d+)?$/,
    loader: 'url?limit=25000&mimetype=application/font-woff'
  },
  {
    test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
    loader: 'url?limit=25000&mimetype=application/octet-stream'
  },
  {
    test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
    loader: 'file'
  },
  {
    test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
    loader: 'url?limit=25000&mimetype=image/svg+xml'
  },
  {
    test: /\.less$/,
    loader: ExtractTextPlugin.extract('css?sourceMap!postcss?sourceMap!less?sourceMap')
  },
  {
    test: /\.jpe?g$|\.gif$|\.png$/,
    loader: 'file'
  },
];

const POSTCSS = function() {
  return [
    require('postcss-cssnext')
  ];
};

// CONFIGS
const VENDOR_CONFIG = {
  target: 'web',
  entry: {
    [VENDOR_NAME]: [
      'es6-shim',
      'es6-promise',
      'reflect-metadata',
      'zone.js/dist/zone',
      'zone.js/dist/long-stack-trace-zone',
      // 'angular2/core',
      // 'angular2/router',
    ]
  },
  output: {
    path: PUBLIC_DIR,
    filename: '[name].js',
    library: VENDOR_NAME,
    libraryTarget: 'var'
  },
  plugins: [
    new DllPlugin({
      name: VENDOR_NAME,
      path: VENDOR_DLL_MANIFEST_PATH
    }),
    MD5_HASH_PLUGIN,
    DEDUPE_PLUGIN,
    OCCURENCE_ORDER_PLUGIN,
    UGLIFY_JS_PLUGIN,
    COMPRESSION_PLUGIN,
  ]
};

const BROWSER_CONFIG = {
  target: 'web',
  entry: {
    [BROWSER_NAME]: [
      BROWSER_SOURCE_PATH
    ]
  },
  output: {
    path: PUBLIC_DIR,
    filename: '[name].js',
    chunkFilename: '[id].' + BROWSER_NAME + '.js',
  },
  plugins: [
    VENDOR_DLL_REFERENCE_PLUGIN,
    EXTRACT_TEXT_PLUGIN,
    MD5_HASH_PLUGIN,
    DEDUPE_PLUGIN,
    OCCURENCE_ORDER_PLUGIN,
    UGLIFY_JS_PLUGIN,
    COMPRESSION_PLUGIN,
    COPY_ASSETS_PLUGIN,
  ],
  devtool: SOURCE_MAPS,
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: BROWSER_LOADERS
  },
  postcss: POSTCSS
};

const WORKER_CONFIG = {
  target: 'web',
  entry: {
    [WORKER_NAME]: [
      WORKER_SOURCE_PATH
    ]
  },
  output: {
    path: PUBLIC_DIR,
    filename: '[name].js',
    chunkFilename: '[id].' + WORKER_NAME + '.js',
  },
  plugins: [
    VENDOR_DLL_REFERENCE_PLUGIN,
    DEFINE_CONSTANTS_PLUGIN,
    IGNORE_MODULES_PLUGIN,
    MD5_HASH_PLUGIN,
    DEDUPE_PLUGIN,
    OCCURENCE_ORDER_PLUGIN,
    UGLIFY_JS_PLUGIN,
    COMPRESSION_PLUGIN,
  ],
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: LOADERS
  },
  postcss: POSTCSS
};

const WORKER_APP_CONFIG = {
  target: 'webworker',
  entry: {
    [WORKER_APP_NAME]: [
      WORKER_APP_SOURCE_PATH
    ]
  },
  output: {
    path: PUBLIC_DIR,
    filename: '[name].js',
    chunkFilename: '[id].' + WORKER_APP_NAME + '.js'
  },
  get plugins() {
    return [
      VENDOR_DLL_REFERENCE_PLUGIN,
      DEFINE_CONSTANTS_PLUGIN,
      IGNORE_MODULES_PLUGIN,
      MD5_HASH_PLUGIN,
      DEDUPE_PLUGIN,
      OCCURENCE_ORDER_PLUGIN,
      UGLIFY_JS_PLUGIN,
      COMPRESSION_PLUGIN,

      // EXTRACT_TEXT_PLUGIN,
    ];
  },
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: LOADERS
  },
  postcss: POSTCSS
};

const SERVER_CONFIG = {
  target: 'node',
  entry: {
    [SERVER_NAME]: [
      SERVER_SOURCE_PATH
    ]
  },
  output: {
    path: PRIVATE_DIR,
    filename: '[name].js',
    chunkFilename: '[id].' + SERVER_NAME + '.js',
    library: SERVER_NAME,
    libraryTarget: 'commonjs2'
  },
  plugins: [
    DEFINE_CONSTANTS_PLUGIN,
    IGNORE_MODULES_PLUGIN,
    COPY_CONFIG_PLUGIN,
    COPY_SERVE_PLUGIN,
    // EXTRACT_TEXT_PLUGIN,
  ],
  node: {
    __dirname:  true,
    __filename: true
  },
  externals: [
    NODE_MODULES.map(function(name) { return new RegExp('^' + name) }),
  ],
  resolve: {
    extensions: ['', '.ts', '.js']
  },
  module: {
    loaders: LOADERS
  },
  postcss: POSTCSS
};

exports = module.exports = [VENDOR_CONFIG, BROWSER_CONFIG, SERVER_CONFIG];

exports.VENDOR_CONFIG     = VENDOR_CONFIG;
exports.SERVER_CONFIG     = SERVER_CONFIG;
exports.BROWSER_CONFIG    = BROWSER_CONFIG;
exports.WORKER_CONFIG     = WORKER_CONFIG;
exports.WORKER_APP_CONFIG = WORKER_APP_CONFIG;

exports.STATS_OPTIONS    = STATS_OPTIONS;
