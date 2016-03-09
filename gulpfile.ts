var gulp = require('gulp'),
	plugins = require('gulp-load-plugins')();

var path = require('path'),
	fork = require('child_process');

fork = fork.fork;

var pathExists = require('path-exists');


process.env.NODE_ENV = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
process.env.PORT = process.env.PORT ? process.env.PORT : '8080';
var env = {
	NODE_ENV: process.env.NODE_ENV,
	PORT: process.env.PORT,
	get isDev() {
		return this.NODE_ENV === 'development';
	},
	get isProd() {
		return this.NODE_ENV === 'production';
	},
	get paths() {
		return; //this.isDev ? paths.dev : paths.prod;
	}
};


/**
 * Definitions
 */

var files = [
	'typings/main.d.ts',
	'src/**/*.ts'
], changed;

function ts(filesRoot:String, filesDest:String, tsProject:any, base?:String) {
	files = changed ? changed : files;

	var result = gulp.src(['typings/main.d.ts'].concat(files), {base: path.join(filesRoot, base ? base : '')})
		.pipe(plugins.debug({title: 'Stream contents:', minimal: true}))
		.pipe(plugins.tslint())
		.pipe(plugins.tslint.report('verbose'))
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.typescript(tsProject));
	return result.js
		.pipe(plugins.if(env.isProd, plugins.uglify()))
		.pipe(plugins.if(env.isDev, plugins.sourcemaps.write({
			sourceRoot: path.join(__dirname, '/', filesRoot)
		})))
		.pipe(gulp.dest(filesDest));
}

var filesRoot = 'src';
var filesDest = 'build';

function tsSrc() {


	var tsProject = plugins.typescript.createProject('tsconfig.json');

	return ts(filesRoot, filesDest, tsProject);
}

function tsServer() {

	var base = 'server';
	var tsProject = plugins.typescript.createProject('tsconfig.json');

	return ts(filesRoot, filesDest, tsProject, base);
}

function tsApp() {

	var tsProject = plugins.typescript.createProject('tsconfig.json');

	return ts(filesRoot, filesDest, tsProject);
}

function tsGulp() {
	filesRoot = './';
	filesDest = './';
	var tsProject = plugins.typescript.createProject('tsconfig.json');

	return ts(filesRoot, filesDest, tsProject);
}

function casper() {
	return gulp.src('build/server.js', {read: false})
		.pipe(plugins.shell([
			'node <%= file.path %>'
		]));
}

function mongodb() {
	return gulp.src(['D:/workspace/mongodb'])
		.pipe(plugins.shell(['mongod --dbpath <%= file.path %>']));
}

function watch() {
	var watch = gulp.watch(['src/**/*.ts'], tsSrc);

	watch.on('change', function (path:String) {
		changed = path;
	});
}

function watchGulp() {
	var watch = gulp.watch('gulpfile.ts', tsGulp);
}

/**
 * Public Tasks!
 */

gulp.task('build', gulp.parallel(
	tsSrc, watchGulp, watch
));
gulp.task('build:server', gulp.series(tsServer));
gulp.task('casper', gulp.series(casper));

gulp.task('mongodb', gulp.series(mongodb));
/**
 * Watches
 */


