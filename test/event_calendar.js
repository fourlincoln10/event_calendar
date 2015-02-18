var libpath = "../lib/node/";
var fs = require("fs");
var util = require("util");
var _ = require("underscore");
var ICAL = require("ical.js");
var ce = require(libpath + "calendar_event");
var moment = require("moment-timezone");
var assert = require("chai").assert;
var nock = require("nock");
var sinon = require("sinon");
var db = require(libpath + "db");
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
  var outputFilename = testResultsDir + '/test_results.json';
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
suite('private helper functions:', function() {

  test('isOccurrenceDate', function(){
    var opts = {
      dtstart: "2014-12-01T09:00:00",
      dtend: "2014-12-01T10:00:00",
      tzid: "America/Los_Angeles",
      summary: "My summary",
      freq: "DAILY",
      count: 5
    };
    var evt = ce.newEvent(opts);
    assert(ce.isOccurrenceDate(evt, "2014-12-01T09:00:00"));
    assert(!ce.isOccurrenceDate(evt, "2014-12-01T09:01:00"));
    console.log(evt.toString());
  });

  test('newExceptionEvent', function(){
    var opts = {
      dtstart: "2014-12-01T09:00:00",
      dtend: "2014-12-01T10:00:00",
      tzid: "America/Los_Angeles",
      summary: "My summary",
      freq: "DAILY",
      count: 5
    };
    var evt = ce.newEvent(opts);
    
    // updated dtstart and summary
    var exceptionSettings = {
      dtstart : "2014-12-03T11:00:00",
      dtend : "2014-12-03T12:00:00",
      uid : evt.getFirstPropertyValue("uid"),
      summary: "Exception summary"
    };
    var exceptionEvent = ce.newExceptionEvent(exceptionSettings, evt);
    assert(exceptionEvent.getFirstPropertyValue("dtstart").toString() === exceptionSettings.dtstart, "dtstart not set correctly");
  });

  test('updateExceptionEvent', function(){
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
    var updatedEvent = ce.updateExceptionEvent(updates, exceptionEvent);
    assert(updatedEvent.getFirstPropertyValue("dtstart").toString() === updates.dtstart, "dtstart not updated properly");
    assert(updatedEvent.getFirstPropertyValue("summary") === updates.summary, "summary not updated properly");
    assert(updatedEvent.getFirstPropertyValue("description") === updates.description, "description not updated properly");
  });


  test('updateMainEvent - Freq not in changeset. Count is in changeset.', function(){
    var doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
    var updates = {
      dtstart: "2014-11-09T09:00:00",
      dtend: "2014-11-09T10:00:00",
      tzid: "America/Los_Angeles",
      count: "6"
    };
    var evt = ce.updateMainEvent(updates, doc.vevents[0]);
    evt = new ICAL.Component(evt);
    assert(evt.getFirstPropertyValue("dtstart").toString() === updates.dtstart, "dtstart not updated properly");
    assert(evt.getFirstPropertyValue("rrule") === null, "count not removed when freq not set");
  });

  test('updateMainEvent - repeat settings', function(){
    var doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var updates = {
      dtstart: "2014-11-09T09:00:00",
      dtend: "2014-11-09T10:00:00",
      tzid: "America/Los_Angeles",
      freq: "MONTHLY",
      count: 10
    };
    var evt = ce.updateMainEvent(updates, doc.vevents[0]);
    evt = new ICAL.Component(evt);
    //console.log(util.inspect(evt.toJSON(), {depth: 5, colors: true}));
    assert(evt.getFirstPropertyValue("dtstart").toString() === updates.dtstart, "dtstart not updated properly");
    assert(evt.getFirstPropertyValue("rrule").freq === updates.freq, "freq not updated propertly");
    assert(evt.getFirstPropertyValue("rrule").interval === 1, "interval !== 1");
  });

});

/**
 * Update Individual Properties
 */
suite('Update property ->', function() {
  var sandbox, doc;
  setup(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, 'getEvent', function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, 'updateEvent', function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, 'deleteEvent', function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  teardown(function(){
    sandbox.restore();
  });

  // dtstart
  test('dtstart', function(done) {
    doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
    var changes = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      dtstart: "2014-12-26T05:27:45",
      dtend: "2014-12-26T06:27:45"
    };
    ce.updateEvent(changes, function(err, updatedEvt) {
      assert(err === null, "err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("dtstart").getFirstValue("dtstart").toString();
      assert(chk == changes.dtstart);
      done();
    });
  });

  // freq
  test('freq', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "MONTHLY"
    };
    ce.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err);
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().freq;
      assert(chk == changes.freq, chk + " !== " + changes.freq);
      done();
    });
  });

  // interval
  test('interval', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY", // no change here just want the new repeat settings to be valid
      interval: 2
    };
    ce.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err);
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().interval;
      assert(chk == changes.interval, chk + " !== " + changes.interval);
      done();
    });
  });

  // byday
  test('byday', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      byday: ["mo", "2tu"],
    };
    ce.updateEvent(changes, function(err, updatedEvt) {
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("byday");
      assert(_.isEqual(chk.sort(), changes.byday.sort()), chk + " !== " + changes.byday);
      done();
    });
  });

  // bymonth
  test('bymonth', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      bymonth: [2, 8]
    };
    ce.updateEvent(changes, function(err, updatedEvt) {
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bymonth");
      assert(_.isEqual(chk.sort(), changes.bymonth.sort()), chk + " !== " + changes.bymonth);
      done();
    });
  });

  // bymonthday
  test('bymonthday', function(done){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      bymonthday: [1, 15],
    };
    ce.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bymonthday");
      assert(_.isEqual(chk.sort(), changes.bymonthday.sort()), chk + " !== " + changes.bymonthday);
      done();
    });
  });

  // bysetpos
  test('bysetpos', function(done){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      bysetpos: [1, 2],
    };
    ce.updateEvent(changes, function(err, updatedEvt) {
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().getComponent("bysetpos");
      assert(_.isEqual(chk.sort(), changes.bysetpos.sort()), chk + " !== " + changes.bysetpos);
      done();
    });
  });

  // count
  test('count', function(done){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      count: 5
    };
    ce.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().count;
      assert(_.isEqual(chk, changes.count), chk + " !== " + changes.count);
      done();
    });
  });

  // until
  test('until', function(done){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var changes = {
      uid: new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      freq: "DAILY",
      until: "2016-01-01T09:00:00"
    };
    ce.updateEvent(changes, function(err, updatedEvt){
      assert.isNull(err, "update err is not null");
      updatedEvt = new ICAL.Component(updatedEvt[0]);
      var chk = updatedEvt.getFirstProperty("rrule").getFirstValue().until.toString();
      assert(chk === changes.until, chk + " !== " + changes.until);
      done();
    });
  });

  // Set multiple
  test('multiple properties', function(done){
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
    ce.updateEvent(changes, function(err, updatedEvt){
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
suite('Update An Event', function() {
  var sandbox, doc;
  setup(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, 'getEvent', function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, 'createEvent', function(evt, callback) {
      callback(null, evt);
    });
    sandbox.stub(db, 'updateEvent', function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, 'deleteEvent', function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  teardown(function(){
    sandbox.restore();
  });

  test('non-repeating - simple property update:', function(done) {
    doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      dtstart: "2014-11-09T11:00:00", // Move dtstart 2-hours ahead
      dtend: "2014-11-09T12:00:00"
    };
    ce.updateEvent(opts, function(err, evt) {
      assert.isNull(err, "err is not null");
      assert(new ICAL.Component(evt[0]).getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      writeToFile(ce.expandEvent(evt), function(){ done(); });
    });
  });

  test('Update non-repeating property of first occurrence and apply to instance only. Should create a new exception event.', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      summary: "Updated summary",
      updateType: "instanceOnly"
    };
    ce.updateEvent(opts, function(err, evt) {
      // console.log(util.inspect(arguments, {depth: 5, colors: true}));
      assert(err === null, "err is not null");
      assert(new ICAL.Component(evt).getFirstPropertyValue("summary") !== opts.summary, "original summary modified when it should not have been");
      assert(evt.length > 1, "evt.length not > 1" + evt.length);
      assert(new ICAL.Component(evt[1]).getFirstPropertyValue("summary")=== opts.summary, "summary not updated properly");
      done();
    });
  });


  test('Update non-repeating property of a pre-existing exception event:', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-10T09:00:00",
      dtstart: "2014-11-10T12:30:00", // move exception evt 1.5 hrs ahead
      dtend: "2014-11-10T13:30:00",
      summary: "Updated exception event summary", // Update summary
      updateType: "instanceOnly"
    };
    ce.updateEvent(opts, function(err, evt) {
      //console.log(util.inspect(arguments, {depth: 5, colors: true}));
      assert(err === null, "err is not null");
      var e = new ICAL.Component(evt[1]);
      assert(e.getFirstPropertyValue("recurrence-id") == opts.recurrenceId, "recurrence-id not equal to opts.recurrenceId");
      assert(e.getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      assert(e.getFirstPropertyValue("summary")=== opts.summary, "summary not updated properly");
      done();
    });
  });

  test('Attempt to update repeat (should be ignored) and non-repeat settings of first occurrence. Apply to instance only. Should create a new exception event:', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      freq: "MONTHLY", // Updated freq
      summary: "Updated summary", // Updated summary
      updateType: "instanceOnly"
    };
    ce.updateEvent(opts, function(err, evt) {
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

  test('Update non-repeat property of 1st occurrence. Apply to this and future:', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      summary : "Updated summary", // updated summary
      updateType: "thisAndFuture"
    };
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("summary") === opts.summary, "main event summary not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });

  test('Update repeat property of 1st occurrence. Apply to this and future:', function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      freq: "MONTHLY", // Change freq
      updateType: "thisAndFuture"
    };
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(evtJSON, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("rrule").freq === opts.freq, "main event freq not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });
  
  test('Update first occurrence hours so they match a pre-existing exception event for a different occurrence. Apply to this and future:', function(done) {
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
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length is not 1"); // exception should be removed because it matches main event after update
      done();
    });
  });

  test("Update first occurrence hours so they do not match a pre-existing exception for a different occurrence. Apply to this and future.", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : "c8f7f2fd-4216-4e3b-8e38-c17190472651@intellasset.com",
      recurrenceId : "2014-11-09T09:00:00",
      dtstart: "2014-11-09T16:00:00", // change hours so they don't match exception
      dtend: "2014-11-09T17:00:00",
      freq: "DAILY",
      count : 5,
      updateType: "thisAndFuture"
    };
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]);
      assert(mainEvt.getFirstPropertyValue("dtstart").toString() === opts.dtstart, "dtstart not updated properly");
      assert(doc.vevents.length === 1, "doc.vevents.length !== 1");
      done();
    });
  });

  test('Update non-repeat property of first occurrence with pre-existing exceptions for first occurrence and one other occurrence. Apply to this and future:', function(done) {
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
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var mainEvt = new ICAL.Component(doc.vevents[0]), exEvt1 = new ICAL.Component(doc.vevents[1]), exEvt2 = new ICAL.Component(doc.vevents[2]);
      assert(mainEvt.getFirstPropertyValue("summary").toString() === opts.summary, "main evt summary not updated properly");
      assert( exEvt1.getFirstPropertyValue("summary").toString() === opts.summary, "exception event 1 summary not updated properly");
      assert( exEvt2.getFirstPropertyValue("summary").toString() === opts.summary, "exception event 2 summary not updated properly");
      done();
    });
  });

  test("Update non-repeating property of 2+ occurrence when there is a pre-existing future exception event. Apply to this and future", function(done) {
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
    ce.updateEvent(opts, function(err, evt) {
      //console.log(util.inspect(arguments, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      var oldMain = new ICAL.Component(doc.vevents[0]);
      assert(oldMain.getFirstPropertyValue("rrule").until == "2014-11-01T23:59:59", "until not set properly on old main event");
      assert(oldMain.getFirstPropertyValue("summary") == "Old summary", "old main summary updated when it should not have been");
      var newEvt = new ICAL.Component(evt[0]);
      //console.log(util.inspect(evt[0], {depth: null, colors: true}));
      assert(newEvt.getFirstPropertyValue("uid") !== oldMain.getFirstPropertyValue("uid"), "new event's UID is not different than the old event's UID");
      assert(newEvt.getFirstPropertyValue("summary") == opts.summary, "new event summary not created correctly");
      // I can't access the exception event in the new event
      done();
    });
  });

  test("Update repeating property of 2+ occurrence when there is a pre-existing future exception event that will not fall on one of the updated occurrence dates. Apply to this and future", function(done) {
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
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      // Assert old event has until 23:59:59
      var oldMain = new ICAL.Component(doc.vevents[0]);
      assert(oldMain.getFirstPropertyValue("rrule").until == "2014-11-01T23:59:59", "until not set properly on old main event");
      // Assert exception event was removed - Don't have access to the new doc here so can't
      done();
    });
  });

  test("Update non-repeat property of an occurrence when there is a pre-existing exception event. Apply to all occurrences.", function(done) {
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
    ce.updateEvent(opts, function(err, evtJSON) {
      //console.log(util.inspect(doc, {colors: true, depth: 5}));
      assert(err === null, "err is not null");
      for(var evt, i = 0; i < doc.vevents.length; ++i) {
        evt = new ICAL.Component(doc.vevents[i]);
        assert(evt.getFirstPropertyValue("summary") == opts.summary, "summary not updated propertly");
      }
      done();
    });
  });

  test("Update repeat property of any occurrence when there is a pre-existing exception event. Apply to all occurrences.", function(done) {
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
    ce.updateEvent(opts, function(err, evtJSON) {
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
suite("Expand an event", function(){
  var sandbox;
  setup(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, 'getEvent', function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, 'updateEvent', function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, 'deleteEvent', function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  teardown(function(){
    sandbox.restore();
  });

  test("non-repeating", function() {
    doc = JSON.parse(JSON.stringify(nonRepeatingEvtDoc));
    var expansion = ce.expandEvent(doc.vevents);
    assert(expansion.length === 1, "expansion.length !== 1");
    var evt = expansion[0];
    var origEvt = new ICAL.Event(new ICAL.Component(doc.vevents[0]));
    assert(evt.title == origEvt.summary, "title does not match summary");
    assert(evt.start == origEvt.startDate.toString(), "start does not match dtstart");
    assert(evt.end == origEvt.endDate.toString(), "end does not match dtend");
  });

  test("repeating", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var expansion = ce.expandEvent(doc.vevents);
    assert(expansion.length == 5, "expansion.length !== 5");
    var ex = expansion[1];
    assert(ex.title == new ICAL.Event(new ICAL.Component(repeatingEvtWithExceptionDoc.vevents[1])).summary, "title does not match summary");
    writeToFile(expansion, function(){ done(); });
  });

});


/**
 * Delete an event
 */

suite("Delete event", function(){
  var sandbox, doc;
  setup(function(){
    sandbox = sinon.sandbox.create();
    sandbox.stub(db, 'getEvent', function(uid, callback) {
      callback(null, doc.vevents);
    });
    sandbox.stub(db, 'updateEvent', function(evt, callback) {
      doc.vevents = evt;
      callback(null, evt);
    });
    sandbox.stub(db, 'deleteEvent', function(evt, callback) {
      callback(null, doc.vevents);
    });
  });
  teardown(function(){
    sandbox.restore();
  });

  test("Instance only - no exception", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      recurrenceId : "2014-11-10T09:00:00",
      applyTo: "instanceOnly"
    };
    ce.deleteEvent(opts, function(err, evt){
      assert(new ICAL.Component(evt[0]).getFirstPropertyValue("exdate").toString() == opts.recurrenceId, "exdate not set properly");
      done();
    });
  });

  test("Instance only - with exception", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      recurrenceId : "2014-11-10T09:00:00",
      applyTo: "instanceOnly"
    };
    ce.deleteEvent(opts, function(err, evt){
      assert(new ICAL.Component(evt[0]).getFirstPropertyValue("exdate").toString() == opts.recurrenceId, "exdate not set properly");
      assert(evt.length == 1, "exception event not removed");
      done();
    });
  });

  test("This and future - with exception", function(done) {
    doc = JSON.parse(JSON.stringify(repeatingEvtWithExceptionDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      recurrenceId : "2014-11-10T09:00:00",
      applyTo: "thisAndFuture"
    };
    ce.deleteEvent(opts, function(err, evt){
      var until = new ICAL.Component(evt[0]).getFirstPropertyValue("rrule").until.toString();
      assert(until, "until not added to the main event");
      assert(evt.length == 1, "exception event not removed");
      done();
    });
  });

  test("all", function(done){
    doc = JSON.parse(JSON.stringify(repeatingEvtDoc));
    var opts = {
      uid : new ICAL.Component(doc.vevents[0]).getFirstPropertyValue("uid"),
      applyTo: "all"
    };
    ce.deleteEvent(opts, function(err, evt){
      assert.isNull(err, "err is not null");
      assert.isDefined(evt, "evt is not defined");
      done();
    });
  });

});