var libpath = "/Users/troy/event_calendar/lib";
var buildpath = "/Users/troy/event_calendar/build";
var fs = require("fs");
var util = require("util");
var _ = require("underscore");
var ICAL = require("ical.js");
var moment = require("moment-timezone");
var assert = require("chai").assert;
var nock = require("nock");
var sinon = require("sinon");
var db = require(libpath + "/node/db");
var ec = require(libpath + "/node/event_calendar");
var testResultsDir = "/Users/troy/calendar_events/lib/browser";


/**
 * Disable actual http requests...requests that
 * are not intercepted will throw an error
 */
nock.disableNetConnect();

/**
 * Convert a jcal event or array of events to a representation
 * suitable for full calendar
 */
function jCalToFullCalendar(jcal, isMultiEvent) {
  jcal = JSON.parse(JSON.stringify(jcal));
  function convertEvt(evt) {
    evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
    return {
      id : evt.getFirstPropertyValue("uid"),
      title : evt.getFirstPropertyValue("summary"),
      allDay : false,
      start : evt.getFirstPropertyValue("dtstart").toString(),
      end :  evt.getFirstPropertyValue("dtend").toString()
    };
  }
  return isMultiEvent ? jcal.map(function(j){ evts.push(convertEvt(j)); }) :
                        [convertEvt(jcal)];
}

/**
 * Write json to a file
 */
function writeToFile(json, callback) {
  var outputFilename = testResultsDir + "/test_results.json";
  fs.writeFile(outputFilename, JSON.stringify(json, null, 2), function(err) {
    if(err) { console.log(err); }
    callback();
  });
}

var nonRepeatingEvtDoc = {
  "_id" : "5899182e1e1157919349134db9005873",
  "_rev" : "1-2bc7c31235b0091946e066b217147aff",
  "vevents" : [
    [ "vevent",
      [
        ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
        ["sequence", {}, "integer", 0],
        ["created", {}, "date-time", "2014-11-09T06:00:00Z"],
        ["last-modified", {}, "date-time", "2014-11-09T17:00:00Z"],
        ["dtstamp", {}, "date-time", "2014-11-09T17:00:00Z"],
        ["dtstart",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-09T09:00:00"
        ],
        ["dtend",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-09T10:00:00"
        ],
        ["summary", {}, "text", "Main event summary"],
        ["description", {}, "text", "description"]
      ],
      []
    ]
  ]
};

var repeatingEvtDoc = {
  "_id" : "5899182e1e1157919349134db9005873",
  "_rev" : "1-2bc7c31235b0091946e066b217147aff",
  "vevents" : [
    [ "vevent",
      [
        ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
        ["sequence", {}, "integer", 0],
        ["created", {}, "date-time", "2014-11-09T06:00:00Z"],
        ["last-modified", {}, "date-time", "2014-11-09T17:00:00Z"],
        ["dtstamp", {}, "date-time", "2014-11-09T17:00:00Z"],
        ["dtstart",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-09T09:00:00"
        ],
        ["dtend",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-09T10:00:00"
        ],
        ["summary", {}, "text", "Main event summary"],
        ["description", {}, "text", "description"],
        ["rrule",
          {},
          "recur",
          {"freq": "DAILY", "count" : 5}
        ]
      ],
      []
    ]
  ]
};

var repeatingEvtWithExceptionDoc = {
  "_id" : "5899182e1e1157919349134db9005873",
  "_rev" : "1-2bc7c31235b0091946e066b217147aff",
  "vevents" : [
    [ "vevent",
      [
        ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
        ["sequence", {}, "integer", 0],
        ["created", {}, "date-time", "2014-11-09T06:00:00Z"],
        ["last-modified", {}, "date-time", "2014-11-09T17:00:00Z"],
        ["dtstamp", {}, "date-time", "2014-11-09T17:00:00Z"],
        ["dtstart",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-09T09:00:00"
        ],
        ["dtend",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-09T10:00:00"
        ],
        ["summary", {}, "text", "Main event summary"],
        ["description", {}, "text", "description"],
        ["rrule",
          {},
          "recur",
          {"freq": "DAILY", "count" : 5}
        ]
      ],
      []
    ],
    [ "vevent",
      [
        ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
        ["sequence", {}, "integer", 0],
        ["created", {}, "date-time", "2014-11-10T06:00:00Z"],
        ["last-modified", {}, "date-time", "2014-11-10T17:00:00Z"],
        ["dtstamp", {}, "date-time", "2014-11-10T17:00:00Z"],
        ["recurrence-id",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-10T09:00:00"
        ],
        ["dtstart",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-10T11:00:00"
        ],
        ["dtend",
          {"tzid" : "America/Los_Angeles"},
          "date-time",
          "2014-11-10T12:00:00"
        ],
        ["summary", {}, "text", "Exception event summary"],
        ["description", {}, "text", "description"]
      ],
      []
    ]
  ]
};

/** 
 * Private helper functions
 */
describe("private helper functions:", function() {

  describe("isOccurrenceDate", function(){
    it("Should return a boolean to indicate if date is an occurrence date", function(){
      var opts = {
        dtstart: "2014-12-01T09:00:00",
        dtend: "2014-12-01T10:00:00",
        tzid: "America/Los_Angeles",
        summary: "My summary",
        freq: "DAILY",
        count: 5
      };
      var evt = ec.newEvent(opts);
      assert(ec.isOccurrenceDate(evt, "2014-12-01T09:00:00"));
      assert(!ec.isOccurrenceDate(evt, "2014-12-01T09:01:00"));
      console.log(evt);
    });
    
  });

  describe("newExceptionEvent", function(){
    it("Should return a boolean to indicate if date is an occurrence date", function(){
      var opts = {
        dtstart: "2014-12-01T09:00:00",
        dtend: "2014-12-01T10:00:00",
        tzid: "America/Los_Angeles",
        summary: "My summary",
        freq: "DAILY",
        count: 5
      };
      var evt = ec.newEvent(opts);
      
      // updated dtstart and summary
      var exceptionSettings = {
        dtstart : "2014-12-03T11:00:00",
        dtend : "2014-12-03T12:00:00",
        uid : new ICAL.Component(evt).getFirstPropertyValue("uid"),
        summary: "Exception summary"
      };
      var exceptionEvent = ec.newExceptionEvent(exceptionSettings, evt);
      assert(new ICAL.Component(exceptionEvent).getFirstPropertyValue("dtstart").toString() === exceptionSettings.dtstart, "dtstart not set correctly");
    });
  });

  describe("updateExceptionEvent", function(){
    it("Should update non-repeating properties", function(){
      var exceptionEvent = [ "vevent",
        [
          ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
          ["sequence", {}, "integer", 1],
          ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
          ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
          ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
          ["recurrence-id",
            {"tzid" : "America/Los_Angeles"},
            "date-time",
            "2014-11-02T09:00:00"
          ],
          ["dtstart",
            {"tzid" : "America/Los_Angeles"},
            "date-time",
            "2014-11-02T11:00:00"
          ],
          ["dtend",
            {"tzid" : "America/Los_Angeles"},
            "date-time",
            "2014-11-02T12:00:00"
          ],
          ["summary", {}, "text", "Exception event"],
          ["description", {}, "text", "description"]
        ],
        []
      ];
      var updates = {
        tzid : "America/Los_Angeles",
        dtstart : "2014-11-02T12:00:00", // 1-hr change
        dtend : "2014-11-02T13:00:00",
        summary: "New summary",
        description: "New description"
      };
      var updatedEvent = ec.updateExceptionEvent(updates, exceptionEvent);
      assert(updatedEvent.getFirstPropertyValue("dtstart").toString() === updates.dtstart, "dtstart not updated properly");
      assert(updatedEvent.getFirstPropertyValue("summary") === updates.summary, "summary not updated properly");
      assert(updatedEvent.getFirstPropertyValue("description") === updates.description, "description not updated properly");
    });
  });


  describe("updateMainEvent", function(){
    it("Should ignore repeat properties when freq not in change set", function(){
      var doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
      var updates = {
        dtstart: "2014-11-09T09:00:00",
        dtend: "2014-11-09T10:00:00",
        tzid: "America/Los_Angeles",
        count: "6"
      };
      var evt = ec.updateMainEvent(updates, doc.vevents[0]);
      evt = new ICAL.Component(evt);
      assert(evt.getFirstPropertyValue("rrule") === null, "count not removed when freq not set");
    });
  });

  describe("updateMainEvent", function(){
    it("Should update repeat settings", function(){
      var doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
      var updates = {
        dtstart: "2014-11-09T09:00:00",
        dtend: "2014-11-09T10:00:00",
        tzid: "America/Los_Angeles",
        freq: "MONTHLY",
        count: 10
      };
      var evt = ec.updateMainEvent(updates, doc.vevents[0]);
      evt = new ICAL.Component(evt);
      //console.log(util.inspect(evt.toJSON(), {depth: 5, colors: true}));
      assert(evt.getFirstPropertyValue("dtstart").toString() === updates.dtstart, "dtstart not updated properly");
      assert(evt.getFirstPropertyValue("rrule").freq === updates.freq, "freq not updated propertly");
      assert(evt.getFirstPropertyValue("rrule").interval === 1, "interval !== 1");
    });
  });

});

/**
 * Update Properties
 */
describe("Update property ->", function() {
  var sandbox, doc;
  before(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, "getEvent", function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, "updateEvent", function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, "deleteEvent", function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  after(function(){
    sandbox.restore();
  });

  // dtstart
  it("Should update dtstart", function(){
      doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
      var changes = {
        uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
        dtstart: "2014-12-26T05:27:45",
        dtend: "2014-12-26T06:27:45"
      };
      ec.updateEvent(changes, function(err, updatedEvt) {
        assert(err === null, "err is not null");
        updatedEvt = new ICAL.Component(updatedEvt[0]);
        var chk = updatedEvt.getFirstProperty("dtstart").getFirstValue("dtstart").toString();
        assert(chk == changes.dtstart);
        done();
      });
    });

  // freq
  it("Should update freq", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "MONTHLY"
    };
    ec.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err);
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().freq;
      assert(chk == changes.freq, chk + " !== " + changes.freq);
      done();
    });
  });

  // interval
  it("Should update interval", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY", // no change here just want the new repeat settings to be valid
      interval: 2
    };
    ec.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err);
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().interval;
      assert(chk == changes.interval, chk + " !== " + changes.interval);
      done();
    });
  });

  it("Should update byday", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      byday: ["mo", "2tu"],
    };
    ec.updateEvent(changes, function(err, updatedEvt) {
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("byday");
      assert(_.isEqual(chk.sort(), changes.byday.sort()), chk + " !== " + changes.byday);
      done();
    });
  });

  // bymonth
  it("Should update bymonth", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      bymonth: [2, 8]
    };
    ec.updateEvent(changes, function(err, updatedEvt) {
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bymonth");
      assert(_.isEqual(chk.sort(), changes.bymonth.sort()), chk + " !== " + changes.bymonth);
      done();
    });
  });

  // bymonthday
  it("Should update bymonthday", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      bymonthday: [1, 15],
    };
    ec.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bymonthday");
      assert(_.isEqual(chk.sort(), changes.bymonthday.sort()), chk + " !== " + changes.bymonthday);
      done();
    });
  });

  // bysetpos
  it("Should update bysetpos", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      bysetpos: [1, 2],
    };
    ec.updateEvent(changes, function(err, updatedEvt) {
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bysetpos");
      assert(_.isEqual(chk.sort(), changes.bysetpos.sort()), chk + " !== " + changes.bysetpos);
      done();
    });
  });

  
  it("Should update count", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      count: 5
    };
    ec.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().count;
      assert(_.isEqual(chk, changes.count), chk + " !== " + changes.count);
      done();
    });
  });

  // until
  it("Should update until", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      until: "2016-01-01T09:00:00"
    };
    ec.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().until.toString();
      assert(chk === changes.until, chk + " !== " + changes.until);
      done();
    });
  });

  // Update multiple
  it("Should update multiple properties", function(){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      dtstart : "2014-12-01T08:30:00",
      dtend : "2014-12-01T09:30:00",
      freq: "DAILY",
      interval: 3,
      byday: ["2tu", "3fr"],
      bymonth: [3,9],
      bysetpos: [3],
      until: "2016-09-01T09:00:00"
    };
    ec.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err not null");
      console.log("updatedEvt: ", util.inspect(updatedEvt, {depth: null, colors: true}));
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      // dtstart
      var chk = updatedEvt.getFirstProperty("dtstart").getFirstValue("dtstart").toString();
      assert(chk == changes.dtstart, chk + " !== " + changes.dtstart);
      // freq
      chk = updatedEvt.getFirstProperty("rrule").getFirstValue().freq;
      assert(_.isEqual(chk, changes.freq), chk + " !== " + changes.freq);
      // interval
      chk = updatedEvt.getFirstProperty("rrule").getFirstValue().interval;
      assert(_.isEqual(chk, changes.interval), chk + " !== " + changes.interval);
      // byday
      chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("byday");
      assert(_.isEqual(chk.sort(), changes.byday.sort()), chk + " !== " + changes.byday);
      // bymonth
      chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bymonth");
      assert(_.isEqual(chk.sort(), changes.bymonth.sort()), chk + " !== " + changes.bymonth);
      // bysetpos
      chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bysetpos");
      assert(_.isEqual(chk.sort(), changes.bysetpos.sort()), chk + " !== " + changes.bysetpos);
      // until
      chk = updatedEvt.getFirstProperty("rrule").getFirstValue().until.toString();
      assert(_.isEqual(chk, changes.until), chk + " !== " + changes.until);
      done();
    });

  });

});

/**
 * Update Event
 */
describe("Update An Event", function() {
  var sandbox, doc;
  before(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, "getEvent", function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, "createEvent", function(evt, callback) {
      callback(null, evt);
    });
    sandbox.stub(db, "updateEvent", function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, "deleteEvent", function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  after(function(){
    sandbox.restore();
  });

  it("Should create a new exception when updating a non-repeating property of the first occurrence applied to instance only.", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      summary: "Updated summary",
      updateType: "instanceOnly"
    };
    ec.updateEvent(opts, function(err, evt) {
      // console.log(util.inspect(arguments, {depth: 5, colors: true}));
      assert(err === null, "err is not null");
      assert(new ICAL.Component(evt).getFirstPropertyValue("summary") !== opts.summary, "original summary modified when it should not have been");
      assert(evt.length > 1, "evt.length not > 1" + evt.length);
      assert(new ICAL.Component(evt[1]).getFirstPropertyValue("summary")=== opts.summary, "summary not updated properly");
      done();
    });
  });


  it("Should update a non-repeating property of a pre-existing exception event:", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-10T09:00:00",
      dtstart: "2014-11-10T12:30:00", // move exception evt 1.5 hrs ahead
      dtend: "2014-11-10T13:30:00",
      summary: "Updated exception event summary", // Update summary
      updateType: "instanceOnly"
    };
    ec.updateEvent(opts, function(err, evt) {
      //console.log(util.inspect(arguments, {depth: 5, colors: true}));
      assert(err === null, "err is not null");
      var e = new ICAL.Component(evt[1]);
      assert(e.getFirstPropertyValue("recurrence-id") == opts.recurrenceId, "recurrence-id not equal to opts.recurrenceId");
      assert(e.getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      assert(e.getFirstPropertyValue("summary")=== opts.summary, "summary not updated properly");
      done();
    });
  });

  it("Should create a new exception event, ignoring repeat settings, when updating first occurrence and applying to instance only.", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      freq: "MONTHLY", // Updated freq
      summary: "Updated summary", // Updated summary
      updateType: "instanceOnly"
    };
    ec.updateEvent(opts, function(err, evt) {
      //console.log(util.inspect(arguments, {depth: 5, colors: true}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(evt[0]), exEvt = new ICAL.Component(evt[1]);
      assert(mainEvt.getFirstPropertyValue("summary") !== opts.summary, "main event summary updated when it should not have been");
      assert(doc.vevents.length === 2, "doc.vevents.length !== 2");
      assert(exEvt.getFirstPropertyValue("summary") === opts.summary, "summary not updated properly");
      assert(mainEvt.getFirstPropertyValue("rrule").freq === "DAILY", "freq !== DAILY");
      done();
    });
  });

  it("Should update a non-repeat property of 1st occurrence when applying to this and future:", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      summary : "Updated summary", // updated summary
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("summary") === opts.summary, "main event summary not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });

  it("Should update a repeat property of the 1st occurrence when applying to this and future:", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      freq: "MONTHLY", // Change freq
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(evtJSON, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("rrule").freq === opts.freq, "main event freq not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });
  
  it("Should remove exception when first occurrence hours are updated to match a pre-existing exception event when applied to this and future:", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      dtstart: "2014-11-09T11:00:00", // adjust start time to match exception event
      dtend: "2014-11-09T12:00:00", // keep dtend an hour after dtstart
      freq: "DAILY", // freq stays the same
      count : 5, // freq stays the same
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length is not 1"); // exception should be removed because it matches main event after update
      done();
    });
  });

  it("Should keep a pre-existing exception event when the first occurrence hours are updated so they do not match the exception and updates are applied to this and future.", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      dtstart: "2014-11-09T16:00:00", // change hours so they don"t match exception
      dtend: "2014-11-09T17:00:00",
      freq: "DAILY",
      count : 5,
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });

  it("Should update non-repeating property of main event and all exception events when updating the first occurrence and applying to this and future:", function(done) {
    doc = {
      "_id" : "5899182e1e1157919349134db9005873",
      "_rev" : "1-2bc7c31235b0091946e066b217147aff",
      "vevents" : [
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 0],
            ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
            ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T09:00:00"
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T10:00:00"
            ],
            ["rrule",
              {},
              "recur",
              {"freq": "DAILY", "count" : 5}
            ],
            ["summary", {}, "text", "Main event summary"],
            ["description", {}, "text", "description"]
          ],
          []
        ],
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 1],
            ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
            ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["recurrence-id",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T09:00:00"
            ],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T12:30:00" // different so exception event is kept on update
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T13:30:00"
            ],
            ["summary", {}, "text", "First occurrence exception event summary"],
            ["description", {}, "text", "First occurrence exception description"]
          ],
          []
        ],
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 1],
            ["last-modified", {}, "date-time", "2014-11-02T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-02T17:00:00Z"],
            ["recurrence-id",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-02T09:00:00"
            ],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-02T11:00:00" // different so exception event is kept on update
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-02T12:00:00"
            ],
            ["summary", {}, "text", "2nd occurrence exception event summary"],
            ["description", {}, "text", "2nd occurrence exception description"]
          ],
          []
        ]
      ]
    };
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-01T09:00:00",
      dtstart : "2014-11-01T09:00:00",
      dtend : "2014-11-01T10:00:00",
      freq: "DAILY",
      count : 5,
      summary: "Updated summary",
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]), exEvt1 = new ICAL.Component(doc.vevents[1]), exEvt2 = new ICAL.Component(doc.vevents[2]);
      assert(mainEvt.getFirstPropertyValue("summary").toString() === opts.summary, "main evt summary not updated properly");
      assert( exEvt1.getFirstPropertyValue("summary").toString() === opts.summary, "exception event 1 summary not updated properly");
      assert( exEvt2.getFirstPropertyValue("summary").toString() === opts.summary, "exception event 2 summary not updated properly");
      done();
    });
  });

  it("Should stop old event from repeating and create a new event when updating a non-repeating property of 2+ occurrence with a pre-existing future exception event and applying updates to this and future", function(done) {
    doc = {
      "_id" : "5899182e1e1157919349134db9005873",
      "_rev" : "1-2bc7c31235b0091946e066b217147aff",
      "vevents" : [
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 0],
            ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
            ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T09:00:00"
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T10:00:00"
            ],
            ["rrule",
              {},
              "recur",
              {"freq": "DAILY", "count" : 5}
            ],
            ["summary", {}, "text", "Old summary"],
            ["description", {}, "text", "description"]
          ],
          []
        ],
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 1],
            ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
            ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["recurrence-id",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-03T09:00:00"
            ],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-03T12:30:00"
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-03T13:30:00"
            ],
            ["summary", {}, "text", "Exception event summary"],
            ["description", {}, "text", "description"]
          ],
          []
        ]
      ]
    };
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-02T09:00:00",
      dtstart: "2014-11-02T09:00:00",
      dtend: "2014-11-02T10:00:00",
      freq: "DAILY",
      count : 5,
      summary: "Updated summary",
      description: "description",
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evt) {
      //console.log(util.inspect(arguments, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var oldMain = new ICAL.Component(doc.vevents[0]);
      assert(oldMain.getFirstPropertyValue("rrule").until == "2014-11-01T23:59:59", "until not set properly on old main event");
      assert(oldMain.getFirstPropertyValue("summary") == "Old summary", "old main summary updated when it should not have been");
      var newEvt = new ICAL.Component(evt[0]);
      //console.log(util.inspect(evt[0], {depth: null, colors: true}));
      assert(newEvt.getFirstPropertyValue("uid") !== oldMain.getFirstPropertyValue("uid"), "new event's UID is not different than the old event's UID");
      assert(newEvt.getFirstPropertyValue("summary") == opts.summary, "new event summary not created correctly");
      // I can"t access the exception event in the new event
      done();
    });
  });

  it("Should stop old event from repeating, create a new event, and remove future exception event when updating a repeating property of 2+ occurrence with a pre-existing future exception event that will not fall on one of the updated occurrence dates when updates are applied to this and future", function(done) {
    doc = {
      "_id" : "5899182e1e1157919349134db9005873",
      "_rev" : "1-2bc7c31235b0091946e066b217147aff",
      "vevents" : [
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 0],
            ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
            ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T09:00:00"
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-01T10:00:00"
            ],
            ["rrule",
              {},
              "recur",
              {"freq": "DAILY", "count" : 5}
            ],
            ["summary", {}, "text", "A summary"],
            ["description", {}, "text", "description"]
          ],
          []
        ],
        [ "vevent",
          [
            ["uid", {}, "text", "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com"],
            ["sequence", {}, "integer", 1],
            ["created", {}, "date-time", "2014-11-01T06:00:00Z"],
            ["last-modified", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["dtstamp", {}, "date-time", "2014-11-01T17:00:00Z"],
            ["recurrence-id",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-03T09:00:00"
            ],
            ["dtstart",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-03T12:30:00"
            ],
            ["dtend",
              {"tzid" : "America/Los_Angeles"},
              "date-time",
              "2014-11-03T13:30:00"
            ],
            ["summary", {}, "text", "Exception event summary"],
            ["description", {}, "text", "description"]
          ],
          []
        ]
      ]
    };
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-02T09:00:00",
      dtstart: "2014-11-02T09:00:00",
      dtend: "2014-11-02T10:00:00",
      freq: "MONTHLY",
      count : 5,
      summary : "A summary",
      updateType: "thisAndFuture"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      // Assert old event has until 23:59:59
      var oldMain = new ICAL.Component(doc.vevents[0]);
      assert(oldMain.getFirstPropertyValue("rrule").until == "2014-11-01T23:59:59", "until not set properly on old main event");
      // Assert exception event was removed - Don"t have access to the new doc here so can"t
      done();
    });
  });

  it("Should update a non-repeat property of the main event and all exception events when updates are applied to all occurrences.", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-11T09:00:00",
      summary : "Updated summary",
      dtstart: "2014-11-11T09:00:00",
      dtend: "2014-11-11T10:00:00",
      freq: "DAILY",
      count : 5,
      updateType: "all"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      for(var evt, i = 0; i < doc.vevents.length; ++i) {
        evt = new ICAL.Component(doc.vevents[i]);
        assert(evt.getFirstPropertyValue("summary") == opts.summary, "summary not updated propertly");
      }
      done();
    });
  });

  it("Should remove all exceptions when updating a repeat property of any occurrence in a series with a pre-existing exception event and applying updates to all occurrences.", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-11T09:00:00",
      dtstart: "2014-11-11T12:00:00",
      dtend: "2014-11-11T13:00:00",
      freq: "MONTHLY",
      count : 5,
      summary : "A summary",
      updateType: "all"
    };
    ec.updateEvent(opts, function(err, evtJSON) {
      //console.log("doc: ", util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });

});

/**
 * Expand an event
 */
describe("Expand an event", function(){
  var sandbox;
  before(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, "getEvent", function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, "updateEvent", function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, "deleteEvent", function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  after(function(){
    sandbox.restore();
  });

  it("Should return the main event when expanding a non-repeating event", function() {
    doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
    var expansion = ec.expandEvent(doc.vevents);
    assert(expansion.length === 1, "expansion.length !== 1");
    var evt = expansion[0];
    var origEvt = new ICAL.Event(new ICAL.Component(doc.vevents[0]));
    assert(evt.title == origEvt.summary, "title does not match summary");
    assert(evt.start == origEvt.startDate.toString(), "start does not match dtstart");
    assert(evt.end == origEvt.endDate.toString(), "end does not match dtend");
  });

  it("Should expand a repeating event", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var expansion = ec.expandEvent(doc.vevents);
    assert(expansion.length == 5, "expansion.length !== 5");
    var ex = expansion[1];
    assert(ex.title == new ICAL.Event(new ICAL.Component(repeatingEvtWithExceptionDoc.vevents[1])).summary, "title does not match summary");
    writeToFile(expansion, function(){ done(); });
  });

});


/**
 * Delete an event
 */

describe("Delete event", function(){
  var sandbox, doc;
  before(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, "getEvent", function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, "updateEvent", function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, "deleteEvent", function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  after(function(){
    sandbox.restore();
  });

  it("Should add an exdate when deleting an instance only with no pre-existing exception", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      recurrenceId : "2014-11-10T09:00:00",
      applyTo: "instanceOnly"
    };
    ec.deleteEvent(opts, function(err, evt){
      assert(new ICAL.Component(evt[0]).getFirstPropertyValue("exdate").toString() == opts.recurrenceId, "exdate not set properly");
      done();
    });
  });

  it("Should add an exdate and remove exception when deleting an instance only with a pre-existing exception", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      recurrenceId : "2014-11-10T09:00:00",
      applyTo: "instanceOnly"
    };
    ec.deleteEvent(opts, function(err, evt){
      assert(new ICAL.Component(evt[0]).getFirstPropertyValue("exdate").toString() == opts.recurrenceId, "exdate not set properly");
      assert(evt.length == 1, "exception event not removed");
      done();
    });
  });

  it("Should stop event from repeating and remove exception when deleting an occurrence of an event with an excpetion and applying to this and future", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      recurrenceId : "2014-11-10T09:00:00",
      applyTo: "thisAndFuture"
    };
    ec.deleteEvent(opts, function(err, evt){
      var until = new ICAL.Component(evt[0]).getFirstPropertyValue("rrule").until.toString();
      assert(until, "until not added to the main event");
      assert(evt.length == 1, "exception event not removed");
      done();
    });
  });

  it("Should delete the entire event when applying delete to all", function(done){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      applyTo: "all"
    };
    ec.deleteEvent(opts, function(err, evt){
      assert.isNull(err, "err is not null");
      assert.isDefined(evt, "evt is not defined");
      done();
    });
  });

});