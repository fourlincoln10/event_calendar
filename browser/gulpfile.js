/*jslint node: true */

"use strict";

var gulp   = require("gulp");
var jshint = require("gulp-jshint");
var mocha  = require("gulp-mocha");
var concat = require("gulp-concat");
var sass = require("gulp-sass");
var tap = require("gulp-tap");
var htmlclean = require("gulp-htmlclean");
var path = require("path");
var fs = require("fs");
var beautify = require('js-beautify').js_beautify;

var templates = {};

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
      prefix + "templates.js",
      prefix + "model.js"
    ])
    .pipe(concat("event_calendar.js"))
    .pipe(gulp.dest("./build"));
});

gulp.task("test", ["concat"], function () {
  return gulp.src("./test/*.js")
             .pipe(mocha({ reporter: "list" }));
});

gulp.task("sass", function() {
  return gulp.src("./lib/sass/*.scss")
             .pipe(gulp.dest("css"));
});

gulp.task("load-templates", function() {
  return gulp.src("./lib/templates/*.html")
    .pipe(htmlclean())
    .pipe(tap(function(file) {
      var prop = path.basename(file.relative, ".html");
      templates[prop] = file.contents.toString();
    }));
});

gulp.task("write-templates", ["load-templates"], function() {
  var stream = fs.createWriteStream("./lib/js/templates.js");
  var pretty = beautify(JSON.stringify(templates), { indent_size: 2 });
  var str = "/**\n * Templates\n * @type {Object}  \n*/\nEvent_Calendar.Templates = " + pretty + ";\n";
  stream.write(str);
  stream.end();
});

gulp.task("watch", function() {
  gulp.watch("./lib/js/*.js", ["test"]);
  gulp.watch("./lib/sass/*.scss", ["sass"]);
});




