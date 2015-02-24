/**
 * Browser Validate Event Unit Tests
 */
moment = require("moment-timezone");
_ = require("underscore");
var expect = require("chai").expect;
var nock = require("nock");
var buildpath = "/Users/troy/event_calendar/browser/build";
require(buildpath + "/event_calendar"); // Instantiates Event_Calendar


/**
 * Disable actual http requests...requests that
 * are not intercepted will throw an error
 */
nock.disableNetConnect();


describe("Validate individual fields", function() {
  var v = Event_Calendar.Validate;

  // dtstart
  describe("dtstart ->", function() {
    it("should return false if dtstart is not a valid date", function(){
      var results = v.validateDtstart("invalid");
      expect(results).to.be.false;
    });
    it("should return true if dtstart is a valid date", function(){
      var results = v.validateDtstart(new Date().toISOString());
      expect(results).to.be.true;
    });
  });

  describe("freq ->", function() {
    it("should return false if freq is invalid", function(){
      var results = v.validateFreq("invalid_freq");
      expect(results).to.be.false;
    });
    it("should return true if freq is valid", function(){
      var results = v.validateFreq("daily");
      expect(results).to.be.true;
    });
  });

  // Interval
  describe("interval ->", function() {
    it("should return false if interval is not an integer", function(){
      var results = v.validateInterval("a");
      expect(results).to.be.false;
    });
    it("should return true if interval is an integer", function(){
      var results = v.validateInterval(10);
      expect(results).to.be.true;
    });
  });

  // bymonth
  describe("bymonth ->", function() {
    it("should return false if bymonth is invalid", function(){
      var results = v.validateBymonth(["not-a-month"]);
      expect(results).to.be.false;
    });
    it("should return true if bymonth is valid", function(){
      var results = v.validateBymonth([1, 12]);
      expect(results).to.be.true;
    });
  });

  // byday
  describe("byday ->", function() {
    it("should return false if byday is invalid", function(){
      var results = v.validateByday(["not_a_day"]);
      expect(results).to.be.false;
    });
    it("should return true if byday is valid", function(){
      var results = v.validateByday(["mo"]);
      expect(results).to.be.true;
    });
  });

  // bymonthday
  describe("bymonthday ->", function() {
    it("should return false if bymonthday is invalid", function(){
      var results = v.validateBymonthday([50]);
      expect(results).to.be.false;
    });
    it("should return true if bymonthday is valid", function(){
      var results = v.validateBymonthday([3,7,27]);
      expect(results).to.be.true;
    });
  });

  // bysetpos
  describe("bysetpos ->", function() {
    it("should return false if bysetpos is invalid", function(){
      var results = v.validateBysetpos(-99);
      expect(results).to.be.false;
    });
    it("should return true if bysetpos is valid", function(){
      var results = v.validateBysetpos(1);
      expect(results).to.be.true;
    });
  });

  // count
  describe("count ->", function() {
    it("should return false if count is not an integer", function(){
      var results = v.validateCount("a");
      expect(results).to.be.false;
    });
    it("should return true if count is an integer", function(){
      var results = v.validateCount(10);
      expect(results).to.be.true;
    });
  });

  // until
  describe("until ->", function() {
    it("should return false if until is not a valid date", function(){
      var results = v.validateUntil("invalid_date");
      expect(results).to.exist;
    });
    it("should return ok if until is a valid ISO date string", function(){
      var results = v.validateUntil(new Date().toISOString());
      expect(results).to.be.true;
    });
  });

});

// RRule
describe("Validate RRule", function() {
  var v = Event_Calendar.Validate;
  var rec;
  beforeEach(function() {
    rec = {
      dtstart : "2015-02-23T09:00:00",
      freq : "daily"
    };
  });

  it("should return error if freq is not specified", function(){
    delete rec.freq;
    var errors = v.validateRRule(rec);
    expect(errors.length).to.be.above(0);
  });

  it("should return error if count and until are both specified", function(){
    rec.count = 5;
    rec.until = "2015-02-27T09:00:00";
    var errors = v.validateRRule(rec);
    expect(errors.length).to.be.above(0);
  });

  it("should return error if freq is yearly and multiple bymonths with multiple bydays are given", function(){
    rec.freq = "yearly";
    rec.bymonth = [1,6];
    rec.byday = ["mo", "we"];
    var errors = v.validateRRule(rec);
    expect(errors.length).to.be.above(0);
  });

  it("There should be no errors if valid", function(){
    var errors = v.validateRRule(rec);
    expect(errors.length).to.be.eql(0);
  });

});

// Event
describe("Validate Event", function() {
  var v = Event_Calendar.Validate;
  var e;
  beforeEach(function() {
    e = {
      uid     : "c8f7f2fd-4216-4e3b-8e38-c17190472651@domain.com",
      sequence: 0,
      created : "2015-02-02T06:00:00",
      lastModified : "2015-02-23T06:00:00",
      dtstart : "2015-02-23T09:00:00",
      dtend   : "2015-02-23T10:00:00",
      freq : "daily",
      count    : 5, 
      summary: "A summary",
      description: "A description"
    };
  });

  it("should return error if rrule is invalid", function(){
    delete e.freq;
    var errors = v.validateEvent(e);
    expect(errors.length).to.be.above(0);
  });

  it("should return error if non-repeat property is invalid", function(){
    e.dtend = "invalid-date";
    var errors = v.validateEvent(e);
    expect(errors.length).to.be.above(0);
  });

  it("should return error if dtstart is before 01/01/1970", function(){
    e.dtstart = "1969-01-01T:09:00:00";
    var errors = v.validateEvent(e);
    expect(errors.length).to.be.above(0);
  });

  it("should return error if dtstart is before until", function(){
    e.dtend = "invalid-date";
    var errors = v.validateEvent(e);
    expect(errors.length).to.be.above(0);
  });

  it("There should be no errors if valid", function(){
    var errors = v.validateEvent(e);
    expect(errors.length).to.be.eql(0);
  });

});