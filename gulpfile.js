var gulp = require('gulp')
, stylus = require('gulp-stylus')
, csso = require('gulp-csso')
, uglify = require('gulp-uglify')
, nodemon = require('gulp-nodemon')
, concat = require('gulp-concat');

gulp.task('default', ['components', 'stylus', 'watch', 'server']);

gulp.task('stylus', function() {
  gulp.src('./views/css/main.styl')
  .pipe(stylus())
  .pipe(csso())
  .pipe(gulp.dest('./public/css'));
});

gulp.task('components', function() {

  // Copy and optimize stylesheets
  gulp
  .src([
    './bower_components/pure/pure.css',
    './bower_components/codemirror/lib/codemirror.css',
    './bower_components/codemirror/addon/hint/show-hint.css',
    './bower_components/codemirror/theme/monokai.css',
  ])
  .pipe(csso())
  .pipe(concat('components.css'))
  .pipe(gulp.dest('./public/css'))
  ;

  // Copy and uglify component javascripts
  gulp.src([
    './bower_components/lodash/dist/lodash.js',
    './bower_components/jquery/dist/jquery.js',
    './bower_components/gl-matrix/dist/gl-matrix.js',
    './bower_components/codemirror/lib/codemirror.js',
    './bower_components/codemirror/addon/hint/show-hint.js',
    './bower_components/codemirror/mode/clike/clike.js'
  ])
  .pipe(concat('components.js'))
  .pipe(uglify())
  .pipe(gulp.dest('./public/js'))
  ;
});

gulp.task('watch', function() {
  gulp.watch('./views/css/**/*.styl', ['stylus']);
});

gulp.task('server', function() {
  nodemon({ script: 'server.js' })
  .on('change', [])
  .on('restart', function() {
  });
});
