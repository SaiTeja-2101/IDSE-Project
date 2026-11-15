const gulp = require('gulp');
const pug = require('gulp-pug');
const data = require('gulp-data');
const textFile = require('./public/game/assets/text/textTemplate.js');
const rename = require('gulp-rename');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const browsersync = require('browser-sync').create();
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const path = require('node:path');
const {bundleGame} = require('./build/bundle.cjs');
const outputRoot = path.resolve(__dirname, '../dist');

// BrowserSync
function browserSync(done) {
    browsersync.init({
        server: {
            baseDir: '../dist/',
        },
        port: 4000,
        host: '127.0.0.1',
        listen: '127.0.0.1',
        ui: false,
        online: false,
        notify: false,
        open: false,
    });
    done();
}

// BrowserSync reload
function browserSyncReload(done) {
    console.log('-> reloading browser...');
    browsersync.reload();
    done();
}   

// Clean assets
function clean() {
    const target = path.resolve(outputRoot, 'game/assets');
    if (!target.startsWith(outputRoot + path.sep)) throw new Error('Unsafe clean target');
    return del([target], {force: true});
}

// Assets
function moveAssets() {
    return gulp
        .src([
            'public/game/assets/**/*',
        ])
        .pipe(gulp.dest('../dist/game/assets'));
}

// Pug
function pugCompile() {
    return gulp.src('views/pages/game/index.pug')
        .pipe(data(function(file) {
            return textFile;
        }))
        .pipe(pug())
        .pipe(gulp.dest('../dist/game')); 
};

// CSS task
function css() {
    return gulp
        .src('./public/game/scss/main.scss')
        .pipe(sass({
            outputStyle: 'compressed',
            includePaths: ['./node_modules/sass-mq', './public/**/*.scss'],
        }))
        .pipe(autoprefixer({
            cascade: false,
        }))
        .pipe(rename('styles-game.min.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('../dist/game/css'))
        .pipe(browsersync.stream());
}


// JS, browserify, babel, etc...
function compileJs() {
    return bundleGame({
        entry: path.resolve(__dirname, 'public/game/controllers/game/gameEntry.js'),
        output: path.resolve(outputRoot, 'game/js/bundle-game.js'),
    });
}

// Watch files
function watchFiles() {
    console.log('The watch starts');
    gulp.watch('./public/game/**/*.scss', css).on('change', function(path, stats) {
        console.log(`File ${path} was changed`);
    });
    gulp.watch('./**/*.pug', gulp.series(pugCompile, browserSyncReload)).on('change', function(path, stats) {
        console.log(`File ${path} was changed`);
    });
    gulp.watch('./public/game/assets/**/*', gulp.series(moveAssets, browserSyncReload)).on('change', function(path, stats) {
        console.log(`File ${path} was changed`);
    });
    gulp.watch('./public/game/**/*.js', gulp.series(compileJs, browserSyncReload)).on('change', function(path, stats) {
        console.log(`File ${path} was changed`);
    });
}


// Define complex tasks
const build = gulp.series(clean, gulp.parallel(moveAssets, css, compileJs, pugCompile));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));

// Export tasks
exports.build = build;
exports.watch = watch;
exports.default = build;
