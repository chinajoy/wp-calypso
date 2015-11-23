/***** WARNING: ES5 code only here. Not transpiled! *****/

/**
 * External dependencies
 */
var webpack = require( 'webpack' ),
	open = require( 'open' ),
	path = require( 'path' );

/**
 * Internal dependencies
 */
var config = require( './server/config' ),
	ChunkFileNamePlugin = require( './server/bundler/plugin' );

/**
 * Internal variables
 */
var CALYPSO_ENV = process.env.CALYPSO_ENV || 'development',
	PORT = process.env.PORT || 3000,
	jsLoader,
	webpackConfig;

function OpenCalypsoInBrowser() {}
OpenCalypsoInBrowser.prototype.apply = function( compiler ) {
	compiler.plugin( 'done', function() {
		open( 'http://calypso.localhost:3000' );
	} );
};

webpackConfig = {
	cache: true,
	entry: {},
	output: {
		path: path.join( __dirname, 'public' ),
		publicPath: '/calypso/',
		filename: '[name].[hash].js',
		chunkFilename: '[name].[chunkhash].js',
		devtoolModuleFilenameTemplate: 'app:///[resource-path]'
	},
	devtool: '#eval',
	module: {
		loaders: [
			{
				test: /sections.js$/,
				exclude: 'node_modules',
				loader: path.join( __dirname, 'server', 'bundler', 'loader' )
			},
			{
				test: /\.json$/,
				loader: 'json-loader'
			},
			{
				test: /\.html$/,
				loader: 'html-loader'
			},
			{
				include: require.resolve( 'tinymce/tinymce' ),
				loader: 'exports?window.tinymce',
			},
			{
				include: /node_modules\/tinymce/,
				loader: 'imports?this=>window',
			}
		]
	},
	resolve: {
		extensions: [ '', '.json', '.js', '.jsx' ],
		modulesDirectories: [ 'node_modules', path.join( __dirname, 'client' ), path.join( __dirname, 'shared' ) ]
	},
	node: {
		console: false,
		process: true,
		global: true,
		Buffer: true,
		__filename: 'mock',
		__dirname: 'mock',
		fs: 'empty'
	},
	plugins: [
		new webpack.DefinePlugin( {
			'process.env': {
				NODE_ENV: JSON.stringify( config( 'env' ) )
			}
		} ),
		new webpack.optimize.OccurenceOrderPlugin( true ),
		new webpack.IgnorePlugin( /^props$/ ),
		new webpack.IgnorePlugin( /^\.\/locale$/, /moment$/ )
	],
	externals: [ 'ipc' ]
};

if ( CALYPSO_ENV === 'desktop' || CALYPSO_ENV === 'desktop-mac-app-store' ) {
	webpackConfig.output.filename = '[name].js';
} else {
	webpackConfig.entry.vendor = [ 'react', 'store', 'page', 'wpcom-unpublished', 'jed', 'debug' ];
	webpackConfig.plugins.push( new webpack.optimize.CommonsChunkPlugin( 'vendor', '[name].[hash].js' ) );
	webpackConfig.plugins.push( new ChunkFileNamePlugin() );
}

jsLoader = {
	test: /\.jsx?$/,
	exclude: /node_modules/,
	loaders: [ 'babel-loader?cacheDirectory&optional[]=runtime' ]
};

if ( CALYPSO_ENV === 'development' ) {
	webpackConfig.plugins.push( new webpack.HotModuleReplacementPlugin() );
	webpackConfig.plugins.push( new OpenCalypsoInBrowser() );
	webpackConfig.entry[ 'build-' + CALYPSO_ENV ] = [
		'webpack-dev-server/client?http://calypso.localhost:' + PORT,
		'webpack/hot/only-dev-server',
		path.join( __dirname, 'client', 'boot' )
	];

	// Add react hot loader before babel-loader
	jsLoader.loaders = [ 'react-hot' ].concat( jsLoader.loaders );
} else {
	webpackConfig.entry[ 'build-' + CALYPSO_ENV ] = path.join( __dirname, 'client', 'boot' );
	webpackConfig.devtool = false;
}

webpackConfig.module.loaders = [ jsLoader ].concat( webpackConfig.module.loaders );

module.exports = webpackConfig;
