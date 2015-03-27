var gulp = require('gulp'),
    watch = require('gulp-watch'),
    concat = require('gulp-concat'),
    fs = require('fs'),
    livereload = require('connect-livereload'),
    shell = require('gulp-shell'),
    connect = require('gulp-connect'),
    sass = require('gulp-sass'),
    scsslint = require('gulp-scss-lint'),
    nodemon = require('gulp-nodemon');

gulp.task('concat', function() {
    fs.unlink('./api/api.js');
    gulp.src(['./api/server.js', './api/*.js'])
        .pipe(concat('api.js'))
        .pipe(gulp.dest('./api/'))
});

gulp.task('watch', function() {
    gulp.watch(['./api/*.js', './api/*/*.js'], ['apiserver']);
});

gulp.task('apiserver', ['concat'], function () {
    setTimeout(function() {
        nodemon({
            script: './api/api.js'
        });
    }, 2000);
    // concat takes time to write the files, but still triggers next job :P
});

gulp.task('default', ['apiserver', 'watch']);

