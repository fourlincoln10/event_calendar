var libpath = "../lib";
require(libpath + '/browser/js/model'); // Instantiates Event_Calendar
var assert = require("chai").assert;
var nock = require("nock");

/**
 * Disable actual http requests...requests that
 * are not intercepted will throw an error
 */
nock.disableNetConnect();

suite.only('Set property:', function() {

  

});
