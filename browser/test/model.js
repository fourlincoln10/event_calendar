/**
 * Browser Event Model Unit Tests
 *
 * @version  0.1
 * @author Troy Martin <troy@scriptedmotion.com>
 * @copyright Copyright (c) 2015, Scripted Motion, LLC
 */
var buildpath = "/Users/troy/event_calendar/browser/build";
require(buildpath + "/event_calendar"); // Instantiates Event_Calendar
var expect = require("chai").expect;
var nock = require("nock");

/**
 * Disable actual http requests...requests that
 * are not intercepted will throw an error
 */
nock.disableNetConnect();


describe("Set data", function() {
  var em = new Event_Calendar.Model();
  var r;
  beforeEach(function() {
    r = {
      dtstart : new Date().toISOString(),
      freq : "never"
    };
  });

  // Set Data
  describe("Set data ->", function() {
    it("should return error if property is invalid", function() {
      var results = em.setProperty("freq", "invalid");
      expect(em.getProperty("freq")).not.toEqual("invalid");
    });
    it("should set property if property is valid", function() {
      var results = em.setProperty("freq", "daily");
      expect(em.getProperty("freq")).toEqual("daily");
    });
  });
});

// Get data
describe("Get data", function() {
    var em = new Event_Calendar.Model();
    var rec;
    beforeEach(function() {
      rec = {
        dtstart : new Date().toISOString(),
        freq : "never"
      };
    });
    describe("Get property ->", function() {
      it("should get property if property exists", function() {
        var r = JSON.parse(JSON.stringify(rec));
        em.setProperty("freq", r.freq);
        expect(em.getProperty("freq")).toEqual(r.freq);
      });
      it("should return undefined if property does not exist", function() {
        var prop = em.getProperty("nonexistent");
        expect(prop).toBeUndefined();
      });
    });
});
