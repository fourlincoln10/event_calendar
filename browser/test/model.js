/*jshint expr: true*/

/**
 * Browser Event Model Unit Tests
 *
 * @version  0.1
 * @author Troy Martin <troy@scriptedmotion.com>
 * @copyright Copyright (c) 2015, Scripted Motion, LLC
 */
postal = require("postal");
var buildpath = "/Users/troy/event_calendar/browser/build";
require(buildpath + "/event_calendar"); // Instantiates Event_Calendar
var expect = require("chai").expect;
var nock = require("nock");

/**
 * Disable actual http requests...requests that
 * are not intercepted will throw an error
 */
nock.disableNetConnect();

/**
 * Events used throughout tests
 */
var existingEvt = {
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

var newEvt = {
  dtstart : "2015-02-23T09:00:00",
  dtend   : "2015-02-23T10:00:00",
  freq : "daily",
  count    : 5, 
  summary: "A summary",
  description: "A description"
};

/**
 * Get Data
 */
describe("Get data", function() {
  var em, ee;
  beforeEach(function() {
    ee = JSON.parse(JSON.stringify(existingEvt));
    em = new Event_Calendar.Model(ee);
  });
  describe("Get saved state ->", function() {
    it("should get saved state", function() {
      expect(em.getSavedState().summary).to.equal(ee.summary);
    });
  });
  describe("Get property ->", function() {
    it("should get property if property exists", function() {
      expect(em.getProperty("freq")).to.equal(ee.freq);
    });
    it("should return undefined if property does not exist", function() {
      var prop = em.getProperty("nonexistent");
      expect(prop).to.be.undefined;
    });
  });
  describe("Get event ->", function() {
    it("should get the event", function() {
      expect(em.getEvent().summary).to.equal(ee.summary);
    });
  });
});

/**
 * Set Data
 */
describe("Set data", function() {
  var ee, ne;
  beforeEach(function() {
    ee = JSON.parse(JSON.stringify(existingEvt));
    ne = JSON.parse(JSON.stringify(newEvt));
  });

  // Set Property
  describe("Set property ->", function() {
    it("should publish error if property is unknown", function(done) {
      var em = new Event_Calendar.Model(ee);
      var sub = postal.subscribe({
        topic: "model.error",
        callback: function(data, envelope){
          expect(data).to.be.instanceOf(Error);
          sub.unsubscribe();
          done();
        }
      });
      var results = em.setProperty("unknown_property", "unknown");
    });
    it("should publish error if property is invalid", function(done) {
      var em = new Event_Calendar.Model(ee);
      var sub = postal.subscribe({
        topic: "model.error",
        callback: function(data, envelope){
          expect(data).to.be.instanceOf(Error);
          sub.unsubscribe();
          done();
        }
      });
      var results = em.setProperty("freq", "invalid");
    });
    it("should publish error if property valid but event validation fails", function(done) {
      var sub = postal.subscribe({
        topic: "model.error",
        callback: function(data, envelope){
          expect(data).to.be.instanceOf(Error);
          sub.unsubscribe();
          done();
        }
      });
      ee.count = 5;
      ee.until = "2015-02-25T09:00:00"; // Can't have both count and until
      var em = new Event_Calendar.Model(ee);
    });
    it("should publish update when property is set", function(done){
      var em = new Event_Calendar.Model(ee);
      var sub = postal.subscribe({
        topic: "model.updated",
        callback: function(data, envelope){
          expect(data.freq).to.equal("daily");
          sub.unsubscribe();
          done();
        }
      });
      var results = em.setProperty("freq", "daily");
    });
  });

  // Set Event
  describe("Set event", function() {
    it("should publish error if a property is invalid", function(done) {
      var sub = postal.subscribe({
        topic: "model.error",
        callback: function(data, envelope){
          expect(data).to.be.instanceOf(Error);
          sub.unsubscribe();
          done();
        }
      });
      ne.freq = "invalid-freq";
      var em = new Event_Calendar.Model(ne);
    });
    it("should publish update when event is set successfully", function(done) {
      var sub = postal.subscribe({
        topic: "model.updated",
        callback: function(data, envelope){
          sub.unsubscribe();
          done();
        }
      });
      var em = new Event_Calendar.Model(ne);
    });
    it("should set saved state when setEvent() is called the 1st time only", function() {
      var em = new Event_Calendar.Model(ne); // calls setEvent()
      ne.summary = "Updated summary";
      em.setEvent(ne);
      expect(em.getSavedState().summary).to.not.equal(ne.summary);
      expect(em.getProperty("summary")).to.equal(ne.summary);
    });
  });

});

/**
 * Remove a property
 */
describe("Remove property", function() {
  var ee;
  beforeEach(function() {
    ee = JSON.parse(JSON.stringify(existingEvt));
  });
  it("It should remove a property", function() {
    var em = new Event_Calendar.Model(ee);
    em.removeProperty("count");
    expect(em.getProperty("count")).to.be.undefined;
  });
  it("It should remove all rrule properties when removing freq", function() {
    var em = new Event_Calendar.Model(ee);
    em.removeProperty("freq");
    expect(em.getProperty("freq")).to.be.undefined;
    expect(em.getProperty("count")).to.be.undefined;
  });
});

