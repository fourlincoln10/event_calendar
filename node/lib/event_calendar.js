var rrule = require("rrule").RRule,
    ICAL = require("ical.js"),
    _ = require("underscore"),
    util = require("util"),
    moment = require("moment-timezone"),
    uuid = require("node-uuid"),
    db = require("./db");


var cfg = {
  "PARAMETER_INDEX" : 1,
  "SUBCOMPONENT_INDEX" : 2,
  "PROPERTY_NAME_INDEX" : 0,
  "PROPERTY_VALUE_INDEX" : 3,
  "RRULEID_PROP_NAME" : "x-sm-rruleid",
  "EXDATEID_PROP_NAME" : "x-sm-exdateid",
  "DATE_NO_TIMEZONE_FORMAT_STRING" : "YYYY-MM-DDTHH:mm:ss",
  "UTC_DATE_NO_MILLISECONDS" : "YYYY-MM-DDTHH:mm:ss",
  "TZID_REQUIRED_MSG" : "tzid is required",
  "REPEAT_PARTS" : ["freq", "interval", "count", "until", "byday", "bymonth", "bymonthday", "bysetpos", "exdate"],
  "UI_UPDATABLE_PROPERTIES" : ["dtstart", "tzid", "dtend", "summary", "description", "freq", "interval", "count", "until", "byday", "bymonth", "bymonthday", "bysetpos"],
  "UI_UPDATABLE_EXCEPTION_EVENT_PROPERTIES" : ["uid", "dtstart", "dtend", "summary", "description"],
  "CALENDAR_COMPONENT_NOT_SET_MSG" : "You must load or create a calendar component first",
  "NO_UID_PASSED_TO_FUNCTION_MSG" : "No event UID passed to function",
  "EXCEPTION_EVENT_NOT_FOUND_MSG" : "Exception event not found",
  "ORIG_DTSTART_REQUIRED_MSG" : "Original datestart is required",
  "UID_REQUIRED_MSG" : "UID is required",
  "MAX_RECURRENCE_EXPANSION" : 500,
  "DOMAIN_NAME" : "intellasset.com"
};

function isEmpty(val) {
  return val === "" || val === null || val === undefined ||
         (Array.isArray(val) && val.length === 0) ||
         (Object.prototype.toString.call(val) === "[object Object]" && Object.keys(val).length === 0);
}

function propertyValuesAreEquivalent(a,b) {
  if(a === b) return true;
  if(isEmpty(a) && isEmpty(b)) return true;
  if(Array.isArray(a) && Array.isArray(b)) {
    var c = _.clone(a).sort();
    var d = _.clone(b).sort();
    return _.isEqual(c,d);
  }
  return false;
}

/**
 * Convert a jCal representation
 * of a list of events to iCal format
 * @param  {Array} vevents Array of events
 * @return {String} iCal representation of the events
 */
function toIcs(vevents) {
  var cal = new ICAL.Component("vcalendar");
  cal.addPropertyWithValue("version", "2.0");
  cal.addPropertyWithValue("prodid", "-//Scripted Motion//IntellAsset//EN");
  cal.addPropertyWithValue("calscale", "GREGORIAN");
  vevents.forEach(function(evt) {
    evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
    cal.addSubcomponent(evt);
  });
  return cal.toString();
}

function newUID() {
  return uuid.v4() + "@" + cfg.DOMAIN_NAME;
}

function intervalWillChange(a,b) {
  // interval is a special case because it is assumed to be 1 if it is empty
  // 
  // a     | b      | will change             | Conditional                                                 | Test                 | Expected Result
  // ------ -------- ------------------------- ------------------------------------------------------------- ----------------------  ------------------
  // empty | empty  | no change               | isEmpty(a) && isEmpty(b)                                    | undefined, undefined | false 
  // empty | 1      | no change               | isEmpty(a) && (!isEmpty(b) && b == 1)                       | undefined, 1         | false
  // empty | > 1    | change                  | isEmpty(a) && (!isEmpty(b) && b > 1)                        | undefined, 2         | true
  // 1     | empty  | no change               | (!isEmpty(a) && a == 1) && isEmpty(b)                       | 1, undefined         | false
  // 1     | 1      | no change               | (!isEmpty(a) && a == 1) && (!isEmpty(b) && b == 1)          | 1, 1                 | false
  // 1     | > 1    | change                  | (!isEmpty(a) && a == 1) && (!isEmpty(b) && b > 1)           | 1, 2                 | true
  // > 1   | empty  | change                  | (!isEmpty(a) && a > 1) && isEmpty(b)                        | 2, undefined         | true
  // > 1   | 1      | change                  | (!isEmpty(a) && a > 1) && (!isEmpty(b) && b == 1)           | 2, 1                 | true
  // > 1   | > 1    | change only if a !== b  | (!isEmpty(a) && a > 1) && (!isEmpty(b) && b > 1) && a !== b | (2, 2), (2,3)        | false, true
  return  (isEmpty(a) && (!isEmpty(b) && b > 1)) ||
          ((!isEmpty(a) && a == 1) && (!isEmpty(b) && b > 1)) ||
          ((!isEmpty(a) && a > 1) && isEmpty(b)) ||
          ((!isEmpty(a) && a > 1) && (!isEmpty(b) && b == 1)) ||
          ((!isEmpty(a) && a > 1) && (!isEmpty(b) && b > 1 && a !== b));
}

function diff(newValues, evt) {
  evt = evt instanceof ICAL.Component ? new ICAL.Component(JSON.parse(JSON.stringify(evt.toJSON()))) : new ICAL.Component(JSON.parse(JSON.stringify(evt)));
  var changes = [], prop;

  // dtstart
  var oldDtstart = getPropertyValue("dtstart", evt);
  if(!propertyValuesAreEquivalent(oldDtstart, newValues.dtstart)) {
    changes.push("dtstart");
  }
  
  // tzid (associated with dtstart)
  if(oldDtstart) {
    var oldTzid = evt.getFirstProperty("dtstart").getParameter("tzid");
    if(newValues.tzid && !propertyValuesAreEquivalent(oldTzid, newValues.tzid)) {
      changes.push("tzid");
    }
  }
  else if (!oldDtstart && newValues.tzid ) {
    changes.push("tzid");
  }

  // dtend
  // If not present, it's not "different".
  var oldDtend = getPropertyValue("dtend", evt);
  if(newValues.dtend && !propertyValuesAreEquivalent(oldDtend, newValues.dtend)) {
    changes.push("dtend");
  }

  // summary
  if(!propertyValuesAreEquivalent(evt.getFirstPropertyValue("summary"), newValues.summary)) {
    changes.push("summary");
  }

  // description
  if(!propertyValuesAreEquivalent(evt.getFirstPropertyValue("description"), newValues.description)) {
    changes.push("description");
  }

  // rrule
  prop = evt.getFirstProperty("rrule");
  if(!prop) { // Means evt does not have an rrule
    cfg.REPEAT_PARTS.forEach(function(part){
      if(!isEmpty(newValues[part])) {
        if(part !== "interval" || (part == "interval" && newValues[part] > 1)) {
          changes.push(part);
        }
      }
    });
  }
  else {
    cfg.REPEAT_PARTS.forEach(function(part) {
      if(part == "interval") {
        if(intervalWillChange(getPropertyValue(part, evt), newValues[part])) {
          changes.push(part);
        }
      }
      else if(!propertyValuesAreEquivalent(getPropertyValue(part, evt), newValues[part])) {
        changes.push(part);
      }
    });
  }
  return changes;
}

/**
 * Determine if an exception event is different 
 * than the main event and thus still needs to be kept
 * @param  {Object} exceptionEvt The exception event
 * @param  {Object} mainEvt      The main event
 * The only differences that matter are:
 *   1. Different start time
 *   2. Summary
 *   3. Description
 */
function exceptionEventDifferentThanMainEvent(exceptionEvt, mainEvt) {
  exceptionEvt = exceptionEvt instanceof ICAL.Component ? exceptionEvt : new ICAL.Component(exceptionEvt);
  mainEvt = mainEvt instanceof ICAL.Component ? mainEvt : new ICAL.Component(mainEvt);
  var mainEvtDtstart = mainEvt.getFirstPropertyValue("dtstart");
  var exceptionEvtDtstart = exceptionEvt.getFirstPropertyValue("dtstart");
  if(!timePortionOfDateTimeMatches(mainEvtDtstart, exceptionEvtDtstart)) return true;
  var exceptionSummary = exceptionEvt.getFirstPropertyValue("summary");
  if(exceptionSummary && mainEvt.getFirstPropertyValue("summary") !== exceptionSummary) return true;
  var exceptionDesc = exceptionEvt.getFirstPropertyValue("description");
  if(exceptionDesc && mainEvt.getFirstPropertyValue("description") !== exceptionDesc) return true;
  return false;
}


function filterUiValues(val) {
  return val ? _.pick(val, cfg.UI_UPDATABLE_PROPERTIES) : {};
}

function getRecurrenceExpansion(evt) {
  var cpy = evt instanceof ICAL.Component ? new ICAL.Component(evt.toJSON()) : new ICAL.Component(evt);
  var dtstart = cpy.getFirstPropertyValue("dtstart");
  if(dtstart === null) {
    cpy.addPropertyWithValue("dtstart", new Date().toISOString());
  }
  dtstart = cpy.getFirstPropertyValue("dtstart");
  var expand = new ICAL.RecurExpansion({
    component: cpy,
    dtstart: dtstart
  });
  return expand;
}

function before(evt, b4, inc) {
  evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
  var maxDate = inc ? b4 : moment(b4).subtract(1, "ms").format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  maxDate = ICAL.Time.fromDateTimeString(maxDate, evt.getFirstProperty("dtstart"));
  var beforeOccurrences = [];
  var expansion = getRecurrenceExpansion(evt);
  var next, ctr = 0, max = cfg.MAX_RECURRENCE_EXPANSION;
  while( (next = expansion.next()) && (next.compare(maxDate) <= 0) && (ctr < max) ) {
    beforeOccurrences.push(next.toJSDate());
    ++ctr;
  }
  return beforeOccurrences;
}

function after(evt, afterDate, inc) {
  evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
  var ad = inc ? moment(afterDate).format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING) : moment(afterDate).subtract(1, "ms").format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  ad = ICAL.Time.fromDateTimeString(ad, evt.getFirstProperty("dtstart"));
  var afterOccurrences = [];
  var expansion = getRecurrenceExpansion(evt);
  var next, ctr = 0, max = cfg.MAX_RECURRENCE_EXPANSION;
  while( (next = expansion.next()) && (next.compare(ad) < 0) ) {
    // Just loop through occurrences until we reach afterDate
  }
  if(next.compare(ad) === 0) afterOccurrences.push(next.toJSDate());
  while( (next = expansion.next()) && (ctr < max) ) {
    afterOccurrences.push(next.toJSDate());
    ++ctr;
  }
  return afterOccurrences;
}

function timePortionOfDateTimeMatches(a,b) {
  a = a instanceof ICAL.Time ? a : ICAL.Time.fromDateTimeString(a);
  b = b instanceof ICAL.Time ? b : ICAL.Time.fromDateTimeString(b);
  return (a.hour   === b.hour)    &&
         (a.minute === b.minute)  &&
         (a.second === b.second);
}

function datePortionOfDateTimeMatches(a,b) {
  a = a instanceof ICAL.Time ? a : ICAL.Time.fromDateTimeString(a);
  b = b instanceof ICAL.Time ? b : ICAL.Time.fromDateTimeString(b);

  return (a.year  === b.year)   &&
         (a.month === b.month)  &&
         (a.day   === b.day);
}

function dateAndTimePortionOfDateTimeMatches(a,b) {
  return datePortionOfDateTimeMatches(a, b) && timePortionOfDateTimeMatches(a, b);
}

/**
 * Update the time portion of a date only
 * @param  {String || ICAL.Time} a The date we want to update
 * @param  {String || ICAL.Time} b The date we pull values from
 * @return {ICAL.Time}   The updated date
 */
function updateTimePortionOfDateTimeOnly(a,b) {
  a = a instanceof ICAL.Time ? a : ICAL.Time.fromDateTimeString(a);
  b = b instanceof ICAL.Time ? b : ICAL.Time.fromDateTimeString(b);
  a.hour   = b.hour;
  a.minute = b.minute;
  a.second = b.second;
  return a;
}

/**
 * Returns true if a date is found an a repeating events set of occurrences
 * @param  {Object}  evt     The repeating event
 * @param  {String}  occDate The date we are inquiring about
 * @return {Boolean}         True if date portion matches an occurence date. False otherwise.
 */
function isOccurrenceDate(evt, occDate, includeTime) {
  evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
  occDate = occDate instanceof ICAL.Time ? occDate : ICAL.Time.fromDateTimeString(occDate);
  var expansion = getRecurrenceExpansion(evt);
  var next, ctr = 0, max = cfg.MAX_RECURRENCE_EXPANSION, result;
  while( (next = expansion.next()) && (ctr < max) ) {
    result = next.compare(occDate);
    if(result === 0) {
      return true;
    }
    if( result > 0 ) { break; }
    ++ctr;
  }
  return false;
}

function getDtstartProps(prop, evt) {
  var dtstart = evt.getFirstProperty("dtstart");
  if(!dtstart) return null;
  dtstart = dtstart.getFirstValue(dtstart);
  return prop == "dtstart" ? dtstart.toString() : dtstart.timezone;
}

function getDtend(evt) {
  return evt.getFirstPropertyValue("dtend").toString();
}

function getRruleProps(prop, evt) {
  var r = evt.getFirstProperty("rrule");
  if(!r) return null;
  var val = r.getFirstValue();
  if(!val) return null;
  if(["freq","count","interval","until"].indexOf(prop) > -1) {
    return val[prop];
  }
  if(["byday", "bymonth", "bymonthday", "bysetpos"].indexOf(prop) > -1) {
    return val.getComponent(prop);
  }
  return null;
}

function getPropertyValue(prop, evt) {
  prop = prop.toLowerCase();
  if(!(evt instanceof ICAL.Component)) {
    evt = new ICAL.Component(evt);
  }
  if(prop === "dtstart" || prop === "tzid") {
    return getDtstartProps(prop, evt);
  }
  if(prop == "dtend") {
    return getDtend(evt);
  }
  if(cfg.REPEAT_PARTS.indexOf(prop) > -1) {
    return getRruleProps(prop, evt);
  }
  return evt.getFirstPropertyValue(prop);
}

function updateTzid(tzid, evt) {
  var dtstart = evt.getFirstPropertyValue("dtstart").toString();
  var m = moment.tz(dtstart, tzid);
  var newDtstart = m.format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  var newProp = newProperty({name: "dtstart", param: {name: "tzid", value: m.tz()}, value: newDtstart });
  evt.removeProperty("dtstart");
  evt.addProperty(newProp);
  return true;
}

function updateDtWithTzid(prop, dtTime, evt) {
  var tzid = evt.getFirstProperty("dtstart").getParameter("tzid");
  var m = moment.tz(dtTime, tzid);
  var newDtTime = m.format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  var newProp = newProperty({name: prop, param: {name: "tzid", value: m.tz()}, value: newDtTime });
  evt.removeProperty(prop);
  evt.addProperty(newProp);
  return true;
}

function updateRruleProp(prop, val, evt) {
  var r = evt.getFirstProperty("rrule");
  if(!r) r = new ICAL.Property("rrule");
  var rrule = r.getFirstValue() || new ICAL.Recur();
  if(["freq","count","interval","until"].indexOf(prop) > -1) {
    rrule[prop] = val;
    evt.updatePropertyWithValue("rrule", rrule);
    return true;
  }
  if(["byday", "bymonth", "bymonthday", "bysetpos"].indexOf(prop) > -1) {
    rrule.setComponent(prop, val);
    evt.updatePropertyWithValue("rrule", rrule);
    return true;
  }
  return false;
}

function updateExdate(val, evt) {
  evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
  var props = evt.getAllProperties("exdate");
  var alreadyExists = _.find(props, function(p){return p.getFirstValue().toString() == val;});
  if(alreadyExists) return;
  var newProp = newProperty({name: "exdate", value: val });
  evt.addProperty(newProp);
  return evt;
}

function updatePropertyValue(prop, val, evt) {
  prop = prop.toLowerCase();
  evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
  if(prop === "dtstart" || prop == "dtend") {
    return updateDtWithTzid(prop, val, evt);
  }
  if(prop === "tzid") {
    return updateTzid(val, evt);
  }
  if(prop == "exdate") {
    updateExdate(val, evt);
  }
  if(cfg.REPEAT_PARTS.indexOf(prop) > -1) {
    return updateRruleProp(prop, val, evt);
  }
  evt.updatePropertyWithValue(prop, val || "");
  return true;
}

/**
 * Increment the sequence number of an event
 * @param  {ICAL.Component} evt The event
 * @return {Undefined} undefined
 */
function incrementSequence(evt) {
  var seq = getPropertyValue("sequence", evt);
  updatePropertyValue("sequence", ++seq, evt);
}

/**
 * Create a new property
 * @param  {Object} opts Values for the new property
 * @return {ICAL.Property} A new ICAL.Property object
 */
function newProperty(opts) {
  var prop = new ICAL.Property(opts.name);
  if(opts.param) {
    prop.setParameter(opts.param.name, opts.param.value);
  }
  prop.setValue(opts.value);
  return prop;
}

/**
 * Create a new calendar event
 * @param  {Object} opts Values for the new event
 *         Note: tzid is required for this to work!
 *         It should be set on login and passed in by the controller.
 * @return {ICAL.Event} An ical.js Event
 */
function newEvent(opts) {
  opts = opts || {};
  var evt = new ICAL.Component("vevent"), prop;
  
  // uid
  evt.addPropertyWithValue("uid", (opts.uid || newUID()) );

  // created
  var created = moment.utc().format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING) + "Z";
  evt.addPropertyWithValue("created", created);

  // last-modified
  evt.addPropertyWithValue("last-modified", created);

  // dtstamp
  evt.addPropertyWithValue("dtstamp", created);

  // sequence
  evt.addPropertyWithValue("sequence", opts.sequence || 0);
  
  // dtstart
  if (typeof opts.tzid == "undefined") {
    return new appError.generalSystem(cfg.TZID_REQUIRED_MSG);
  }
  var dtstart = opts.dtstart || moment().tz(opts.tzid).format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  prop = newProperty({name: "dtstart", param: {name: "tzid", value: opts.tzid}, value: dtstart });
  evt.addProperty(prop);

  // dtend
  var dtend = opts.dtend || moment(dtstart).tz(opts.tzid).add(1, "hour").format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  prop = newProperty({name: "dtend", param: {name: "tzid", value: opts.tzid}, value: dtend });
  evt.addProperty(prop);

  // summary
  evt.addPropertyWithValue("summary", opts.summary || "");

  // description
  evt.addPropertyWithValue("description", opts.description || "");
  
  // Repeat properties
  if(opts.freq) opts.freq = opts.freq.toUpperCase();
  if(opts.exdate) opts.exdate = Array.isArray(opts.exdate) ? opts.exdate.join() : opts.exdate;
  cfg.REPEAT_PARTS.forEach(function(rp){
    if(rp in opts) {
      updatePropertyValue(rp, opts[rp], evt);
    }
  });

  // recurrence-id
  if(opts.recurrenceId) {
    prop = newProperty({name: "recurrence-id", param: {name: "tzid", value: opts.tzid}, value: opts.recurrenceId });
    evt.addProperty(prop);
  }

  return evt.toJSON();
}

/**
 * Get an exception event from an array of events
 * @param  {String} recurrenceId The recurrence-id of the exception event
 * @param  {Array} eventArray   Array of events
 * @return {ICAL.Component} An ICAL.Component representation of the exception event
 *                          or null if the event is not found.
 */
function getExceptionFromList(recurrenceId, eventArray) {
  if(!recurrenceId) return null;
  var exceptionEvent = null;
  eventArray.forEach(function(evt) {
    evt = new ICAL.Component(evt);
    var recId = evt.getFirstPropertyValue("recurrence-id");
    if(recId && recId == recurrenceId) {
      exceptionEvent = evt;
    }
  });
  return exceptionEvent;
}

/**
 * Expand an event into concrete instances
 * Instances are represented by an object suitable for full calendar
 * @param  {Object} evt The event
 * @return {Array} Array of instances
 */
function expandEvent(evt) {
  var e = new ICAL.Event(new ICAL.Component(evt[0]));
  if(!e.isRecurring()) {
    return [{
      id: e.uid,
      title: e.summary,
      allDay: false,
      start: e.startDate.toString(),
      end: e.endDate.toString()
    }];
  }
  for(var i = 1; i < evt.length; ++i) {
    e.relateException(new ICAL.Event(new ICAL.Component(evt[i])));
  }
  var occ, occDetails, fullCalEvt, events = [];
  i = e.iterator();
  while(i && (occ = i.next())) {
    occDetails = e.getOccurrenceDetails(occ);
    fullCalEvt = {
      id: occDetails.item.uid,
      title: occDetails.item.summary,
      allDay: false,
      start: occDetails.startDate.toString(),
      end: occDetails.endDate.toString()
    };
    events.push(fullCalEvt);
  }
  return events;
}

/**
 * Create a new exception event
 * evt is the main event
 * values must contain
 *   uid: UID of the main event
 * values may contain:
 *   updated dtstart
 *   updated summary
 *   updated description
 */
function newExceptionEvent(values, evt) {
  if(!values.uid) return new appError.badRequest(cfg.UID_REQUIRED_MSG);
  values = _.pick(values, "uid", "dtstart", "summary", "description");
  evt = (evt instanceof ICAL.Component) ? evt : new ICAL.Component(evt);
  values.dtstart = values.dtstart || values.recurrenceId || evt.getFirstPropertyValue("dtstart").toString();
  values.tzid = evt.getFirstProperty("dtstart").getParameter("tzid");
  values.sequence = evt.getFirstPropertyValue("sequence") + 1;
  values.recurrenceId = values.recurrenceId ? values.recurrenceId : moment.tz(values.dtstart, values.tzid).format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  return newEvent(values);
}

/**
 * Update an exception event
 * @param  {Object} values Updated values
 * @param  {Object} evt The exception event
 * @return {Object} jcal representation of the event
 */
function updateExceptionEvent(values, evt) {
  values = _.pick(values, cfg.UI_UPDATABLE_EXCEPTION_EVENT_PROPERTIES);
  evt = (evt instanceof ICAL.Component) ? evt : new ICAL.Component(evt);
  
  // uid
  if(values.uid) {
    updatePropertyValue("uid", values.uid, evt);
  }
  // sequence
  var updateSeq = (values.dtstart && evt.getFirstPropertyValue("dtstart").toString() !== values.dtstart) ||
                  (values.dtend   && evt.getFirstPropertyValue("dtend").toString()   !== values.dtend);
  if(updateSeq) {
    incrementSequence(evt);
  }
  // dtstart
  if(values.dtstart) {
    updatePropertyValue("dtstart", values.dtstart, evt);
  }
  // dtend
  if(values.dtend) {
    updatePropertyValue("dtend", values.dtend, evt);
  }
  // summary
  if(values.summary) {
    updatePropertyValue("summary", values.summary, evt);
  }
  // description
  if(values.description) {
    updatePropertyValue("description", values.description, evt);
  }
  // last-modified
  var lm = moment.utc().format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING) + "Z";
  updatePropertyValue("last-modified", lm, evt);
  
  // dtstamp
  updatePropertyValue("dtstamp", lm, evt);
  
  return evt;
}

/**
 * Update a main event
 * rrule values should replace the rrule as a set, not individually. Consider byday. If 
 * byday is not present in the changeset, the system could interpret that to mean the 
 * existing byday should be removed or it could interpret it to mean it should be left
 * alone. byday's presence/absence affects the rrule as a whole so I've chosen to require
 * the UI to send all of the values instead of just a changeset. Consequently, the rrule
 * will be rebuilt as a whole if any rrule properties are present in the changeset.
 * @param  {Object} values Updated values
 * @return {Object} The updated main event
 */
function updateMainEvent(values, mainEvt) {
  values = filterUiValues(values);
  mainEvt = mainEvt instanceof ICAL.Component ? mainEvt : new ICAL.Component(mainEvt);
  
  // If freq is not in the changeset or it is set to the empty string 
  // ignore any repeat properties that were sent.
  values = !values.freq ? _.omit(values, cfg.REPEAT_PARTS) : values;

  // Remove the existing rrule so it can be rebuilt 
  // if updated RRULE properties were sent.
  mainEvt.removeProperty("rrule");

  // update or insert the new values
  var updatedProperties = Object.keys(values);
  updatedProperties.forEach(function(prop){
    updatePropertyValue(prop, values[prop], mainEvt);
  });

  // Update last modified
  var lm = moment.utc().format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING) + "Z";
  updatePropertyValue("last-modified", lm, mainEvt);

  // Update dtstamp
  updatePropertyValue("dtstamp", lm, mainEvt);

  // increment sequence if appropriate
  if(updatedProperties.indexOf("dtstart") > -1 || updatedProperties.indexOf("dtend") > -1 || _.intersection(updatedProperties, cfg.REPEAT_PARTS).length > 0) {
    incrementSequence(mainEvt);
  }

  return mainEvt.toJSON();
}

/**
 * Update instance only
 * @param  {Object} opts New values for the instance
 * @param  {Object} evt  The event
 * @return {Object}      The updated event
 */
function updateInstance(opts, evt) {
  var exEvt;
  opts = _.omit(opts, cfg.REPEAT_PARTS);
  exEvt = getExceptionFromList(opts.recurrenceId, evt);
  if(exEvt) {
    exEvt = updateExceptionEvent(opts, exEvt);
  }
  else {
    var mainEvt = new ICAL.Component(evt[0]);
    exEvt = newExceptionEvent(opts, mainEvt);
    evt.push(exEvt);
  }
  return evt;
}

/**
 * Update this and future events starting 
 * with the first occurrence of the event
 * @param  {Object} opts Updated values
 * @param  {Object} evt  The event
 * @return {Object} The updated event
 */
function updateThisAndFutureFirstOcc(opts, evt) {
  opts = _.clone(opts);
  updateMainEventAndAllExceptions(opts, evt);
  //console.log(toIcs(evt));
  return evt;
}

/**
 * Stop an event from repeating
 * @param  {Object} evt     jCal or ICAL.Component representation of an event
 * @param  {string} occDate occDate occurrence date-time
 * @return {ICAL.Component} ICAL.Component representation of the updated event
 */
function stopEventRepeating(evt, occDate) {
  // Remove count and add until 23:59:59 the day before the instance
  // to the recur rule of the old event so it doesn't repeat anymore.
  evt = evt instanceof ICAL.Component ? evt : new ICAL.Component(evt);
  var rrule = evt.getFirstPropertyValue("rrule");
  delete rrule.count;
  var dtstart = evt.getFirstProperty("dtstart");
  var oldTzid = dtstart.getParameter("tzid");
  var past = moment.tz(occDate, oldTzid).subtract(1, "day").hour(23).minute(59).second(59).format(cfg.DATE_NO_TIMEZONE_FORMAT_STRING);
  var until = new ICAL.Time.fromDateTimeString(past, dtstart);
  updatePropertyValue("until", until , evt);
  return evt;
}

/**
 * Update an occurrence and all future occurrences
 * @param  {Object} opts Updated values
 * @param  {Object} evt The event
 * @return {Object} The updated event
 */
function updateThisAndFutureSecondPlusOcc(opts, evt) {
  opts = _.clone(opts);
  // Remove count and add until 23:59:59 the day before the instance
  // to the recur rule of the old event so it doesn't repeat anymore.
  var mainEvt = stopEventRepeating(evt[0], opts.recurrenceId);

  // Increment the sequence number of the old event
  incrementSequence(mainEvt);

  // Update the old event
  evt[0] = mainEvt.toJSON();

  // Create a new event
  var newEvtValues = filterUiValues(opts);
  newEvtValues.tzid = opts.tzid || mainEvt.getFirstProperty("dtstart").getParameter("tzid");
  var newEvt = newEvent(newEvtValues);
  var vevents = [newEvt];
  
  // Loop through FUTURE exception events:
  //  Remove exception if the event is no longer set to repeat
  //  Remove exception if there isn't an occurrence date that matches its recurrence-id
  //  Apply changes to the exception event
  //  Compute changeset from the new event. If they now match, remove the exception
  var newEvtRepeats = _.intersection(Object.keys(newEvtValues), cfg.REPEAT_PARTS).length > 0;
  var seriesStartDate = newEvtValues.dtstart;
  delete newEvtValues.dtstart;
  newEvtValues.uid = new ICAL.Component(newEvt).getFirstPropertyValue("uid");
  for(var i = 1; i < evt.length; ++i) {
    var exEvt = new ICAL.Component(evt[i]);
    if( (+new Date(exEvt.getFirstPropertyValue("dtstart").toString())) > +new Date(seriesStartDate) ) {
      var exOccDate = exEvt.getFirstPropertyValue("recurrence-id");
      if(newEvtRepeats && isOccurrenceDate(newEvt, exOccDate, false)) {
        updateExceptionEvent(newEvtValues, exEvt);
        if(exceptionEventDifferentThanMainEvent(exEvt, newEvt)) {
          vevents.push(exEvt.toJSON());
        }
      }
      evt.splice(i, 1);
    }
  }
  //console.log(toIcs(vevents));
  return {oldEvent: evt, newEvent: vevents};
}

/**
 * Update this and future occurrences
 * @param  {Object} opts Updated values
 * @param  {Object} evt The event
 * @return {Object} The updated event
 */
function updateThisAndFuture(opts, evt) {
  var expansion = getRecurrenceExpansion(evt[0]);
  var firstOcc = expansion.next();
  var onFirstOcc = ( opts.recurrenceId && dateAndTimePortionOfDateTimeMatches(opts.recurrenceId, firstOcc) ) ||
                   (!opts.recurrenceId && opts.dtstart && dateAndTimePortionOfDateTimeMatches(firstOcc, opts.dtstart));
  return onFirstOcc ? updateThisAndFutureFirstOcc(opts,evt) : updateThisAndFutureSecondPlusOcc(opts,evt);
}

/**
 * Helper function that updates a main event and all exception events
 * @param  {Object} opts Updated values
 * @param  {Object} evt The event
 * @return {Object} The updated event
 */
function updateMainEventAndAllExceptions(opts, evt) {
  opts = _.clone(opts);
  var mainEvt = new ICAL.Component(evt[0]);
  // Update the main event
  evt[0] = updateMainEvent(opts, mainEvt);
  // don't apply dtstart to future exception events
  delete opts.dtstart;
  // Loop through all exceptions and update them
  for(var i = 1; i < evt.length; ++i) {
    var excepEvt = new ICAL.Component(evt[i]);
    // Remove exception if there isn't an occurrence date that matches its recurrence-id (repeat settings may have changed)
    if(!isOccurrenceDate(mainEvt, excepEvt.getFirstPropertyValue("recurrence-id"))) {
      evt.splice(i, 1);
      continue;
    }
    // Update the exception and see if it now matches the main event
    updateExceptionEvent(opts, excepEvt);
    if(!exceptionEventDifferentThanMainEvent(excepEvt, mainEvt)) {
      evt.splice(i, 1);
    }
  }
  return evt;
}

/**
 * Update all occurrences of an event
 * @param  {Object} opts New vaules for the event
 * @param  {Object} evt  The event
 * @return {Object} The updated event
 */
function updateAllOccurrences(opts, evt) {
  opts = _.clone(opts);
  var mainEvt = new ICAL.Component(evt[0]);
  // You can only change the hours of dtstart and choose to apply changes
  // to all occurrences, so set the dtstart to the main event's dtstart, and update the hours only.
  if(opts.dtstart) {
    opts.dtstart = updateTimePortionOfDateTimeOnly(mainEvt.getFirstPropertyValue("dtstart"), opts.dtstart).toString();
  }
  updateMainEventAndAllExceptions(opts, evt);
  return mainEvt instanceof ICAL.Component ? mainEvt.toJSON() : mainEvt;
}

function deleteInstanceOnly(opts, evt) {
  if(isOccurrenceDate(evt[0], opts.recurrenceId, true)) {
    var main = new ICAL.Component(evt[0]);
    updatePropertyValue("exdate", opts.recurrenceId, main);
    evt[0] = main.toJSON();
    evt = _.reject(evt, function(e) {
      e = new ICAL.Event(new ICAL.Component(e));
      return e.recurrenceId && e.recurrenceId.toString() == opts.recurrenceId;
    });
  }
  return evt;
}

function deleteThisAndFuture(opts, evt) {
  // Remove count and add until 23:59:59 the day before the instance date to the rrule
  var mainEvt = evt[0];
  mainEvt = stopEventRepeating(mainEvt, opts.recurrenceId);
  evt = _.reject(evt, function(e){
    e = new ICAL.Event(new ICAL.Component(e));
    return e.recurrenceId && (+new Date(e.recurrenceId) >= +new Date(opts.recurrenceId));
  });
  return evt;
}


var api = {

  /**
   * Get an event from the database
   * @param  {Object}   opts     Must contain opts.uid
   *                             May contain opts.recurrenceId
   * @param  {Function} callback The function to call back upon completion
   * @return {undefined} undefined
   */
  load : function load(opts, callback) {
    return db.getEvent(opts.uid, function(err, evt){
      if(err) return callback(err);
      if(opts.recurrenceId) {
        return callback(null, getExceptionFromList(opts.recurrenceId, evt));
      }
      callback(null, evt[0]);
    });
  },


  createEvent : function createEvent(opts, callback) {
    opts = filterUiValues(opts);
    // TODO: Validate opts
    var evt = newEvent(opts);
    db.createEvent(evt, function(err, e){
      return err ? callback(err) : callback(null, e);
    });
  },


  /**
   * Update a calendar event. Possible scenarios are:
   *   Update a non-repeating event
   *   Update an instance of a repeating event
   *   Update an instance and all future instances of a repeating event
   *   Update all occurrences of a repeating event
   * @param  {Object}   opts  see cfg.UI_UPDATABLE_PROPERTIES for possible properties
   * @param  {Function} callback     The function to call upon completion
   */
  updateEvent : function updateEvent(opts, callback) {
    if(!opts.uid) return callback(new appError.badRequest(cfg.NO_UID_PASSED_TO_FUNCTION_MSG));
    var ret;
    
    db.getEvent(opts.uid, function(err, evt) {
      if(err) return callback(err);
      
      // Non-repeating event
      if(!opts.updateType) {
        evt[0] = updateMainEvent(opts, evt[0]);
        db.updateEvent(evt, function(err, e) {
          return err ? callback(err) : callback(null, e);
        });
      }
      
      // Instance only
      else if(opts.updateType == "instanceOnly") {
        evt = updateInstance(opts, evt);
        db.updateEvent(evt, function(err, e) {
          return err ? callback(err) : callback(null, e);
        });
      }

      // This and Future
      else if (opts.updateType == "thisAndFuture") {
        ret = updateThisAndFuture(opts, evt);
        // Return value from 2nd+ occurrence update
        if(ret.oldEvent) {
          db.updateEvent(ret.oldEvent, function(err, e) {
            if(err) return callback(err);
            db.createEvent(ret.newEvent, function(err, e) {
              return err ? callback(err) : callback(null, e);
            });
          });
        }
        // First occurrence was updated
        else {
          db.updateEvent(ret, function(err, e) {
            return err ? callback(err) : callback(null, e);
          });
        }
      }

      // All Occurrences
      else if (opts.updateType == "all") {
        ret = updateAllOccurrences(opts, evt);
        return ret instanceof Error ? callback(ret) : callback(null, ret);
      }

      else {
        return callback(new appError.badRequest("Unrecognized update type " + opts.updateType));
      }
    });

  },

  /**
   * Delete an event
   * @param  {Object}   opts     opts.uid always required.
   *                             opts.recurrenceId required when deleting instance
   *                             opts.applyTo should be included but not required
   * @param  {Function} callback function that will be called upon completion
   */
  deleteEvent : function deleteEvent(opts, callback) {
    if(!opts.uid) return callback(new appError.badRequest(cfg.NO_UID_PASSED_TO_FUNCTION_MSG));
    db.getEvent(opts.uid, function(err, evt) {
      if(err) return callback(err);
      // All
      if(!opts.applyTo || opts.applyTo == "all") {
        db.deleteEvent(opts.uid, function(err, result){
         return err ? callback(err) : callback(null, result);
        });
      }
      // Instance only
      if(opts.applyTo == "instanceOnly") {
        evt = deleteInstanceOnly(opts, evt);
        db.updateEvent(evt, function(err, e) {
          return err ? callback(err) : callback(null, e);
        });
      }
      // This and future
      if(opts.applyTo == "thisAndFuture") {
        evt = deleteThisAndFuture(opts, evt);
        db.updateEvent(evt, function(err, e) {
          return err ? callback(err) : callback(null, e);
        });
      }
    });
  },

  // Testing purposes
  
  toIcs : toIcs,

  // Testing purposes
  after : after,

  // Testing purposes
  before : before,

  // Testing purposes
  newEvent : newEvent,

  // Testing purposes
  isOccurrenceDate : isOccurrenceDate,

  // Testing purposes
  newExceptionEvent : newExceptionEvent,

  // Testing purposes
  updateExceptionEvent : updateExceptionEvent,

  // Testing purposes
  updateMainEvent : updateMainEvent,

  // Testing purposes
  expandEvent : expandEvent

};

module.exports = api;




