var gulp = require('gulp'),
	plugins = require('gulp-load-plugins')();

var path = require('path'),
	fork = require('child_process').fork;

var pathExists = require('path-exists');

var filesRoot = 'src';
var filesDest = "build";


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
		return this.isDev ? paths.dev : paths.prod;
	}
};


/**
 * Definitions
 */

var app = {
	instance: {},

	path: 'build/server.js',

	env: env,

	start: function (callback) {
		process.execArgv.push('--harmony');

		app.instance = fork(app.path, {silent: true, env: app.env});
		app.instance.stdout.pipe(process.stdout);
		app.instance.stderr.pipe(process.stderr);

		plugins.util.log(plugins.util.colors.cyan('Starting'), 'express server ( PID:', app.instance.pid, ')');

		if (callback) callback();
	},

	stop: function (callback) {
		if (app.instance.connected) {
			app.instance.on('exit', function () {
				plugins.util.log(plugins.util.colors.red('Stopping'), 'express server ( PID:', app.instance.pid, ')');
				if (callback) callback();
			});
			return app.instance.kill('SIGINT');
		}
		if (callback) callback();
	},

	restart: function restart(event) {
		gulp.series(
			app.stop,
			app.start
		);
	}
};

var files = [
	'typings/main.d.ts',
	"src/**/*.ts"
], changed;

function ts(filesRoot, filesDest, files, tsProject) {
	var title = arguments.callee.caller.name,
		files = changed ? changed : files;

	var result = gulp.src(['typings/main.d.ts'].concat(files))
		.pipe(plugins.debug({title: "Stream contents:", minimal: true}))
		.pipe(plugins.tslint())
		.pipe(plugins.tslint.report('verbose'))
		.pipe(plugins.sourcemaps.init())
		.pipe(plugins.typescript(tsProject));
	return result.js
		.pipe(plugins.if(env.isProd, plugins.uglify()))
		.pipe(plugins.if(env.isDev, plugins.sourcemaps.write({
			sourceRoot: path.join(__dirname, '/', filesRoot)
		})))
		.pipe(gulp.dest(filesDest))
}

var tsProject = plugins.typescript.createProject('tsconfig.json');

function tsSrc() {
	console.log(files);
	return ts(filesRoot, filesDest, files, tsProject);
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
	var watch = gulp.watch('src/**/*.ts', tsSrc);

	watch.on('change', function (path, stats) {
		changed = path;
	});
}

/**
 * Public Tasks
 */

gulp.task('build', gulp.series(
	tsSrc, watch
));
gulp.task('casper', gulp.series(casper));

gulp.task('mongodb', gulp.series(mongodb));
/**
 * Watches
 */


