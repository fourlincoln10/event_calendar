/*jslint node: true */

"use strict";

var gulp   = require("gulp");
var jshint = require("gulp-jshint");
var mocha  = require("gulp-mocha");
var concat = require("gulp-concat");

gulp.task("lint", function () {
  return gulp.src(["./lib/js/*.js"])
             .pipe(jshint(".jshintrc"))
             .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("concat", ["lint"], function () {
    var prefix = "./lib/js/";
    return gulp.src([
      prefix + "global.js",
      prefix + "cfg.js",
      prefix + "errors.js",
      prefix + "helpers.js",
      prefix + "validate.js",
      prefix + "model.js"
    ])
    .pipe(concat("event_calendar.js"))
    .pipe(gulp.dest("./build"));
});

gulp.task("test", ["concat"], function () {
  return gulp.src("./test/*.js")
             .pipe(mocha({ reporter: "list" }));
});

