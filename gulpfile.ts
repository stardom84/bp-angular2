import {Config as CONFIG} from './CONFIG';

var gulp = require('gulp'),
	plugins = require('gulp-load-plugins')(),
	Paths = CONFIG.path,
	Env = CONFIG.env,
	watcher, server;

var path = require('path'),
	fork = require('child_process');

fork = fork.fork;

var pathExists = require('path-exists');


/**
 * Definitions
 */

var changed;

var ts = {
	compile: function compile(root:String, build:String, target:Array<string>, tsProject:any, base?:String) {
		target = changed ? changed : target;

		var result = gulp.src(['typings/main.d.ts'].concat(target), {base: path.join(root, base ? base : '')})
			.pipe(plugins.debug({title: 'Stream contents:', minimal: true}))
			.pipe(plugins.tslint())
			.pipe(plugins.tslint.report('verbose'))
			.pipe(plugins.sourcemaps.init())
			.pipe(plugins.typescript(tsProject));
		return result.js
			.pipe(plugins.if(Env.isProd, plugins.uglify()))
			.pipe(plugins.if(Env.isDev, plugins.sourcemaps.write({
				source: path.join(__dirname, '/', root)
			})))
			.pipe(gulp.dest(build));
	},
	server: function tsServer() {
		var tsProject = plugins.typescript.createProject('tsconfig.json'),
			target = [
				'typings/main.d.ts',
				'src/server/**/*.ts'
			];

		return ts.compile(Paths.source, Paths.build, target, tsProject, 'server');
	},
	app: function tsApp() {
		var tsProject = plugins.typescript.createProject('tsconfig.json'),
			target = [
				'typings/main.d.ts',
				'src/app/**/*.ts'
			];
		return ts.compile(Paths.source, Paths.build, target, tsProject);
	},
	gulp: function tsGulp() {
		var target = [
			'typings/main.d.ts',
			'gulpfile.ts'
		];

		var tsProject = plugins.typescript.createProject('tsconfig.json');
		return ts.compile('./', './', target, tsProject);
	},

	start: function start() {
		if (/gulpfile/gi.test(changed)) {
			return ts.gulp();
		} else if (/\/server/gi) {
			return ts.server();
		} else if (/\/app/gi) {
			return ts.app();
		}
	}
};

function index() {
	var css = ['build/css/*'];
	var libs = ['build/libs/*'];

	if (Env.isDev) {
		libs = Paths.dev.libs.js.map(lib => path.join('build/libs/', lib));
	}

	var source = gulp.src(libs, {read: false});

	return gulp.src('src/app/index.html')
		.pipe(plugins.inject(source, {ignorePath: 'build'}))
		.pipe(plugins.preprocess({context: Env}))
		.pipe(gulp.dest('build'));
	//.pipe(plugins.connect.reload());
}

function mongodb() {
	return gulp.src(['D:/workspace/mongodb'])
		.pipe(plugins.shell(['mongod --dbpath <%= file.path %>']));
}

function watch() {
	watcher = gulp.watch(['src/**/*.ts', 'gulpfile.ts'], ts.start);

	watcher.on('change', (path:string) => {
		changed = path;
	});
}

function serve() {
	server = plugins.liveServer.new(path.join(Paths.build, Paths.serverFile));
	server.start();
}

/**
 * Public Tasks
 */

/*build*/
gulp.task('build:server', gulp.series(ts.server));
gulp.task('build:app', gulp.series(ts.app));
gulp.task('build:gulp', gulp.series(ts.gulp));
gulp.task('build', gulp.parallel(
	'build:server', 'build:app', watch
));

/*mongodb*/
gulp.task('mongodb', gulp.series(mongodb));

/*index*/
gulp.task('index', index);

/*serve*/
gulp.task('serve', gulp.series('build', serve));

/**
 * Watches
 */


