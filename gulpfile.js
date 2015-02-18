/*jslint node: true */

"use strict";

var gulp   = require("gulp");
var jshint = require("gulp-jshint");
var mocha  = require("gulp-mocha");

gulp.task("lint", function () {
  return gulp.src(["./lib/browser/js/*.js", "./lib/node/*.js"])
             .pipe(jshint(".jshintrc"))
             .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("mocha", function () {
  gulp.src("./test/*.js")
    .pipe(mocha({ ui: "tdd", reporter: "list" }));
});

gulp.task("test", ["lint", "mocha"]);
gulp.task("ci", ["lint", "mocha"]);
gulp.task('default', ["lint", "mocha"]);