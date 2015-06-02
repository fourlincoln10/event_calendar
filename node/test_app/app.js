/**
 * Module dependencies.
 */
var express = require('express'),
    favicon = require('serve-favicon'),
    methodOverride = require('method-override'),
    bodyParser = require('body-parser'),
    errorHandler = require('errorhandler'),
    routes = require('./routes'),
    http = require('http'),
    request = require('request'),
    eController = require("./controllers/event_calendar_controller");

var dbBaseUrl = "http://localhost:5984/";

/**
 * Make sure couchdb is running
 */
request.head(dbBaseUrl, function(err, response, body){
  if(err) {
    console.error('Couchdb is not running');
    process.exit(1);
  }
  if(response.statusCode !== 200){
    console.error('Couchdb returned statusCode: ', response.statusCode);
    process.exit(1);
  }
});

/**
 * Initialize / configure the app
 */
var app = express();
app.set("port", 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
//app.use(favicon());
app.use(methodOverride());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + "public"));
app.use(errorHandler());


/**
 * Routes
 */
app.get("/", eController.list);


/**
 * Create http Server
 */
var server = http.createServer(app);
server.listen(app.get("port"), function() {
  console.log("Event calendar test app is listening on port " + app.get("port"));
});