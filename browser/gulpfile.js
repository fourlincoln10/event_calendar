/*jslint node: true */

"use strict";

var gulp   = require("gulp");
var jshint = require("gulp-jshint");
var mocha  = require("gulp-mocha");
var concat = require("gulp-concat");
var sass = require("gulp-sass");
var scsslint = require("gulp-scss-lint");
var tap = require("gulp-tap");
var htmlclean = require("gulp-htmlclean");
var path = require("path");
var fs = require("fs");
var beautify = require('js-beautify').js_beautify;
var templates = {};
var buildJsPrefix = "./lib/js/";
var buildJsFiles = [
  buildJsPrefix + "global.js",
  buildJsPrefix + "cfg.js",
  buildJsPrefix + "errors.js",
  buildJsPrefix + "helpers.js",
  buildJsPrefix + "validate.js",
  buildJsPrefix + "templates.js",
  buildJsPrefix + "model.js"
];
var buildThirdPartyPrefix = "./lib/js/third_party";
var buildThirdPartyJsFiles = [
  buildThirdPartyPrefix + "/jquery-2.1.3.min.js",
  buildThirdPartyPrefix + "/lodash-min.js",
  buildThirdPartyPrefix + "/moment.min.js",
  buildThirdPartyPrefix + "/fullcalendar-2.2.6/fullcalendar.min.js",
  buildThirdPartyPrefix + "/ical.js/build/ical.js",
  buildThirdPartyPrefix + "/jstz-1.0.4.min.js",
  buildThirdPartyPrefix + "/kendo.custom.min.js",
];

gulp.task("lint", function () {
  return gulp.src(["./lib/js/*.js"])
             .pipe(jshint(".jshintrc"))
             .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("build", ["lint", "write-templates"], function () {
    return gulp.src(buildJsFiles)
    .pipe(concat("event_calendar.js"))
    .pipe(gulp.dest("./build"));
});

gulp.task("test", ["build"], function () {
  return gulp.src("./test/*.js")
             .pipe(mocha({ reporter: "list" }));
});

gulp.task("sass", function() {
  return gulp.src("./lib/sass/*.scss")
             .pipe(scsslint())
             .pipe(sass({errLogToConsole: true}))
             .pipe(gulp.dest("./lib/css"));
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

gulp.task("build-test-site", ["sass"], function () {
    gulp.src(buildJsFiles)
        .pipe(concat("event_calendar.js"))
        .pipe(gulp.dest("./test_site/js"));
    gulp.src(buildThirdPartyJsFiles)
        .pipe(concat("lib.js"))
        .pipe(gulp.dest("./test_site/js"));
    gulp.src("./lib/js/third_party/fullcalendar-2.2.6/fullcalendar.min.css")
        .pipe(gulp.dest("./test_site/css"));
    return gulp.src("./lib/css/*.css")
               .pipe(gulp.dest("./test_site/css"));
});

gulp.task("watch-test-site", function() {
  gulp.watch("./lib/js/*.js", ["build-test-site"]);
  gulp.watch("./lib/sass/*.scss", ["build-test-site"]);
  gulp.watch("./lib/templates/*.html", ["write-templates", "build-test-site"]);
});


