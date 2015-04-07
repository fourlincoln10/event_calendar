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
var beautify = require("js-beautify").js_beautify;
var templates = {};

gulp.task("sass", function() {
  return gulp.src(["./lib/sass/*.scss"])
   .pipe(scsslint())
   .pipe(sass({errLogToConsole: true, outputStyle: "expanded"}))
   .pipe(gulp.dest("./lib/css"));
});

gulp.task("move-kendo-files", function(){
  return gulp.src(["./lib/js/third_party/kendo-ui-core/dist/styles/web/Default/*"])
    .pipe(gulp.dest("./build/css/Default"));
});

gulp.task("build-css", gulp.series("sass", "move-kendo-files", function concat_css() {
  return gulp.src([
    "./lib/css/*.css",
    "./lib/js/third_party/fullcalendar-2.2.6/fullcalendar.min.css",
    "./lib/js/third_party/kendo-ui-core/dist/styles/web/kendo.common.core.css",
    "./lib/js/third_party/kendo-ui-core/dist/styles/web/kendo.default.css"
  ])
  .pipe(concat("screen.css"))
  .pipe(gulp.dest("./build/css"));
}));

gulp.task("load-templates", function() {
  return gulp.src(["./lib/templates/*.html"])
    .pipe(htmlclean())
    .pipe(tap(function(file) {
      var prop = path.basename(file.relative, ".html");
      templates[prop] = file.contents.toString();
    }));
});

gulp.task("write-templates", gulp.series("load-templates", function write_file(cb) {
  var pretty = beautify(JSON.stringify(templates), { indent_size: 2 });
  var str = "/**\n * Templates\n * @type {Object}  \n*/\nEvent_Calendar.Templates = " + pretty + ";\n";
  fs.writeFileSync("./lib/js/templates.js", str);
  cb();
}));

gulp.task("lint", function () {
  return gulp.src(["./lib/js/*.js"])
   .pipe(jshint(".jshintrc"))
   .pipe(jshint.reporter("jshint-stylish"));
});

gulp.task("concat-third-party-js", function(){
  return gulp.src([
    "./lib/js/third_party/*.js",
    "!./lib/js/third_party/ical.js",
    "./lib/js/third_party/fullcalendar-2.2.6/fullcalendar.min.js",
    "./lib/js/third_party/kendo-ui-core/dist/js/kendo.ui.core.min.js"
  ])
  .pipe(concat("lib.js"))
  .pipe(gulp.dest("./build/js"));
});

gulp.task("concat-js", function(){
  // Leave this as a list so the files are concatenated in the given order
  return gulp.src([
    "./lib/js/global.js",
    "./lib/js/cfg.js",
    "./lib/js/errors.js",
    "./lib/js/helpers.js",
    "./lib/js/validate.js",
    "./lib/js/templates.js",
    "./lib/js/model.js",
    "./lib/js/entry.js",
    "./lib/js/basic_inputs.js",
    "./lib/js/repeat_settings.js"
  ])
  .pipe(concat("event_calendar.js"))
  .pipe(gulp.dest("./build/js"));
});

gulp.task("test", function () {
  return gulp.src("./test/*.js")
    .pipe(mocha({ reporter: "list" }));
});

gulp.task("build", gulp.series("build-css", "write-templates", "lint", "test", "concat-third-party-js", "concat-js"));

gulp.task("move-js-to-test-site", function(){
  return gulp.src(["./build/js/*.js"])
    .pipe(gulp.dest("./test_site/js"));
});

gulp.task("move-css-to-test-site", function(){
  return gulp.src(["./build/css/**/*"])
    .pipe(gulp.dest("./test_site/css"));
});

gulp.task("build-all", gulp.series("build", "move-js-to-test-site", "move-css-to-test-site"));

gulp.task("watch", function() {
  var files = [
    "./lib/js/*.js",
    "!./lib/js/templates.js", // ignore templates.js
    "./lib/templates/*.html",
    "./lib/sass/*.scss"
  ];
  gulp.watch(files, gulp.parallel("build-all"));
});





