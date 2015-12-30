(function() {
    'use strict';

    var gulp = require('gulp'),
        $ = require('gulp-load-plugins')();

    gulp.task('scripts', function() {
        gulp.src('./src/scripts/**/*.js')
            .pipe($.concatUtil())
            .pipe($.rename({
                basename: 'main'
            }))
            .pipe(gulp.dest('./assets/scripts/'))
    });

    gulp.task('styles', function() {
        gulp.src('./src/styles/main.less')
            .pipe($.less())
            .pipe(gulp.dest('./assets/styles/'))
    });

    gulp.task('watch', function() {
        gulp.watch('./src/**/*.js', [ 'scripts' ]);
        gulp.watch('./src/**/*.less', [ 'styles' ]);
    });

    gulp.task('default', [ 'scripts', 'styles' ]);
})();
