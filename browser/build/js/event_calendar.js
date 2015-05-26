/* jshint strict: false */
/* jshint -W117  */

/**
 * Event Calendar.
 * MIT License (see license.txt)
 */
if (typeof Event_Calendar === "undefined") {
  if (typeof exports === "object") {
    Event_Calendar = exports; // CommonJS
  } else if (typeof window !== "undefined") {
    this.Event_Calendar = {}; // Browser
  } else {
    Event_Calendar = {};
  }
}

/**
 * Configuration
 * @type {Object}
 */
Event_Calendar.Cfg = {
  SM_SCREEN_BREAKPOINT        : 550,
  MODAL_WINDOW_CLASS          : "modal-window",
  MODAL_SLIDEDOWN_CLASS       : "modal-slidedown",
  SHOW_MODAL_CLASS            : "show",
  FREQ_VALUES                 : ["daily", "weekly", "monthly", "yearly"],
  BYDAY_VALUES                : ["su", "mo", "tu", "we", "th", "fr", "sa", "day", "weekday", "weekendday"],
  BYDAY_REGEX                 : /^(-?[1-4]?)(su|mo|tu|we|th|fr|sa)$/, // /^(-?[1-4]?)([a-z]+)/
  BY_MONTH_VALUES             : ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  FIELDS_MANAGED_BY_VIEW      : ["dtstart", "dtend", "freq","interval", "byday","bymonthday","bymonth","bysetpos","count","until", "summary", "location", "description"],
  REPEAT_PROPERTIES           : ["freq","interval","byday","bymonthday","bymonth","bysetpos","count","until"],
  UID_REGEX                   : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ISO_DATETIME_REGEX          : /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d(:[0-5]\d)?Z?$/,
  ISO_DATE_REGEX              : /^\d{4}-[01]\d-[0-3]\d$/,
  KENDO_DATE_PARSE_FORMATS    : [
                                  "yyyy-MM-dd", "MM/dd/yyyy", "MM/d/yyyy", "M/dd/yyyy", "M/d/yyyy", "MM/dd/yy", "MM/d/yy", "M/dd/yy", "M/d/yy",
                                  "MM.dd.yyyy", "MM.d.yyyy", "M.dd.yyyy", "M.d.yyyy", "MM.dd.yy", "MM.d.yy", "M.dd.yy", "M.d.yy",
                                  "MM-dd-yyyy", "MM-d-yyyy", "M-dd-yyyy", "M-d-yyyy", "MM-dd-yy", "MM-d-yy", "M-dd-yy", "M-d-yy",
                                  "MM dd yyyy", "MM d yyyy", "M dd yyyy", "M d yyyy", "MM dd yy", "MM d yy", "M dd yy", "M d yy",
                                ],
  MOMENT_DATE_FORMAT          : "YYYY-MM-DD",
  MOMENT_24_HR_TIME_FORMAT    : "HH:mm",
  MOMENT_12_HR_TIME_FORMAT    : "hh:mm A",
  MOMENT_DATE_TIME_FORMAT     : "YYYY-MM-DDTHH:mm",
  MOMENT_DATE_DISPLAY_FORMAT  : "MM/DD/YYYY",
  KENDO_DATE_DISPLAY_FORMAT   : "MM/dd/yyyy",
  WEEKDAYS                    : ["mo", "tu", "we", "th", "fr"],
  WEEKEND_DAYS                : ["sa", "su"],
  DAYS_OF_THE_WEEK            : ["su", "mo", "tu", "we", "th", "fr", "sa"],
  DAY_OCCURRENCE_REGEX        : /^(-?[1-4]?)([a-z]+)/,
  DAILY_INTERVAL_TIME_UNIT    : "day(s)",
  WEEKLY_INTERVAL_TIME_UNIT   : "week(s)",
  MONTHLY_INTERVAL_TIME_UNIT  : "month(s)",
  YEARLY_INTERVAL_TIME_UNIT   : "year(s)",
  SUMMARY_ERR_MSG             : "Must be 64-characters or less",
  DESCRIPTION_ERROR           : "Must be 256-characters or less",
  FREQ_ERR_MSG                : "Invalid frequency",
  FREQ_REQUIRED_ERR_MSG       : "Required",
  INTERVAL_REQUIRED_ERR_MSG   : "Required",
  INTERVAL_ERR_MSG            : "Must be an integer >= 1",
  INVALID_DATE_ERR_MSG        : "Invalid date and/or time",
  DTSTART_REQUIRED_ERR_MSG    : "Required",
  DTEND_REQUIRED_ERR_MSG      : "Required",
  END_BEFORE_START_ERR_MSG    : "Event can't end before it starts",
  DTSTART_TOO_OLD_ERR_MSG     : "Start date too far in past",
  COUNT_ERR_MSG               : "Must be an integer >= 1",
  COUNT_AND_UNTIL_ERR_MSG     : "Can't have both count and until",
  BYDAY_ERR_MSG               : "Invalid byday",
  BYMONTHDAY_ERR_MSG          : "Integer between 1 and 31 (inclusive)",
  BYMONTH_ERR_MSG             : "Integer between 1 and 12 (inclusive)",
  BYSETPOS_ERR_MSG            : "Integer between 1 and 4 (inclusive) or -1",
  MULT_MONTHS_AND_OCC_ERR_MSG : "1 month limit when \"On\" set to multi-day"
};
  
/**
 * Custom errors
 * @return {Object} Object containing custom error functions
 */
Event_Calendar.Errors = (function(){
  
  "use strict";

 /**
   * Custom error objects
   * @param  {String} msg A short description of the error
   * @param  {String} eventProp The event property the error applies to e.g. "freq"
   * @return undefined Use the new operator when instantiating e.g. new InvalidError("a msg");
   */
function InvalidError(msg, eventProp) {
   if(Error.captureStackTrace) if(Error.captureStackTrace) Error.captureStackTrace(this);
   this.message = msg || "Invalid";
   this.eventProperty = eventProp || "";
}
InvalidError.prototype = Object.create(Error.prototype);


function UnknownPropertyError(msg, eventProp) {
   if(Error.captureStackTrace) Error.captureStackTrace(this);
   this.message = msg || "Unknown Property";
   this.eventProperty = eventProp || "";
}
UnknownPropertyError.prototype = Object.create(Error.prototype);


function RequiredError(msg, eventProp) {
   if(Error.captureStackTrace) Error.captureStackTrace(this);
   this.message = msg || "Required";
   this.eventProperty = eventProp || "";
}
RequiredError.prototype = Object.create(Error.prototype);

/**
  * Error Group
  * @param  {String} msg A short description
  * @param  {String} errors An array of errors
  * @return undefined Use the new operator when instantiating e.g. new InvalidError("a msg");
  */
function ErrorGroup(msg, errors) {
   if(Error.captureStackTrace) Error.captureStackTrace(this);
   this.message = msg || "One or more errors were detected";
   this.errors = errors || [];
}
ErrorGroup.prototype = Object.create(Error.prototype);


var api = {
  InvalidError : InvalidError,
  UnknownPropertyError: UnknownPropertyError,
  RequiredError: RequiredError,
  ErrorGroup: ErrorGroup
};

return api;

})();

/**
 * 
 * Error Handler
 */

Event_Calendar.ErrorHandler = (function(){
  "use strict";
  
  var basicInputsContainer,
      repeatSettingsContainer,
      rootContainer;

  function ErrorHandler(biCnt, rsCnt, rootCnt) {
    basicInputsContainer = biCnt;
    repeatSettingsContainer = rsCnt;
    rootContainer = rootCnt;
    initEvents();
  }

  function initEvents() {
    rootContainer.on("model.error", modelError);
    rootContainer.on("model.set", modelSet);
  }

  function modelSet(evt, prop) {
    if(typeof prop == "object") {
      Object.keys(prop).forEach(function(k){removePropError(k, prop[k]);});
    } else {
      removePropError(prop);
    }
  }

  function modelError(evt, err) {
    render(err);
  }
  
  function modelSaveError(err) {
    removeAll();
    render(err);
  }

  function errorsPresent() {
    return $(".error", rootContainer).length > 0;
  }

  function errorClass(prop) {
    return prop + "Error";
  }

  function removeAll() {
    $(".error", rootContainer).remove();
  }

  function removePropError(prop) {
    var cls = errorClass(prop);
    if(cls) {
      $("." + cls, rootContainer).remove();
    }
  }
  function insertInDom(msg, prop) {
    if( !prop ) return console.error(msg);
    var html = "<div class='error " + errorClass(prop) + "'>" + msg + "</div>";
    // summary
    if( prop == "summary" ) {
      $(".title-row label:first-of-type", rootContainer).after(html);
    } 
    // dtstart, dtstartdate, dtstarttime
    else if( prop == "dtstart" ||  prop == "dtstartdate" || prop == "dtstarttime" ) {
      $(".dtstart-group", rootContainer).prepend(html);
    }
    // dtend, dtenddate, dtstarttime
    else if ( prop == "dtend"   ||  prop == "dtenddate"   || prop == "dtendtime"  ) {
      $(".dtend-group", rootContainer).prepend(html);
    }
    // location
    else if( prop == "location" ) {
      $(".location-row label:first-of-type", rootContainer).after(html);
    }
    // description
    else if( prop == "description" ) {
      $(".description-row label:first-of-type", rootContainer).after(html);
    }
    // freq
    else if( prop == "freq" ) {
      $(".freq-row", rootContainer).prepend(html);
    }
    // interval
    else if( prop == "interval" ) {
      $(".interval-row", rootContainer).prepend(html);
    }
    // count, until
    else if ( prop == "until" || prop == "count" ) {
      $(".end-row", rootContainer).prepend(html);
    }
    // byday
    else if ( prop == "byday" ) {
      $(".weekday-row, .monthday-occurrence-row, .year-day-row", rootContainer).prepend(html);
    }
    // bymonthday
    else if (prop == "bymonthday") {
      $(".monthday-numeric-row", rootContainer).prepend(html);
    }
    // bysetpos
    else if ( prop == "bysetpos" ) {
      $(".monthday-occurrence-row, .year-day-row", rootContainer).prepend(html);
    }
    // bymonth
    else if ( prop == "bymonth" ) {
      $(".year-month-row", rootContainer).prepend(html);
    }
    // unknown property
    else {
      console.error("Unknown property: " + prop);
      console.error("Error msg: ", msg);
    }
  }
  
  function render(err) {
    err = err.errors || [err];
    err.forEach(function(e) {
      removePropError(e.eventProperty);
      insertInDom(e.message, e.eventProperty);
    });
  }

  // API
  var api = {
    errorsPresent : errorsPresent,
    render : render, 
    removePropError : removePropError,
    removeAll : removeAll
  };

  ErrorHandler.prototype = api;

  return ErrorHandler;

})();

/**
 * Helpers
 * @type {Object}
 */
Event_Calendar.Helpers = {
  /**
   * Returns true if i is an integer or a string that can be coerced into an integer
   * @param  {Mixed}  i Value to be checked
   * @return {Boolean} True if i is an integer or can be coerced into one
   */
  isInteger : function isInteger(i) {
    return typeof i !== "undefined" && !isNaN(parseInt(i, 10)) && Math.floor(i) == i;
  },

  convertDateTimeStrToUTC : function convertDateTimeStrToUTC(dtstr) {
    if(dtstr.slice(-1) !== "Z") {
      dtstr = moment(dtstr).utc().format("YYYY-MM-DDTHH:mm") + "Z";
    }
    return dtstr;
  },

  convertDateTimeStrToLocal: function convertDateTimeStrToLocal(dtstr) {
    if(dtstr.slice(-1) == "Z") {
      dtstr = moment(dtstr).local().format("YYYY-MM-DDTHH:mm");
    }
    return dtstr;
  },

  roundDateToNearestHalfHour : function roundDateToNearestHalfHour(dt) {
    var coeff = 1000 * 60 * 30; // 1000 ms/sec * 60 sec/min * 30 min/1 = 1800000 ms.
    var roundedMs = Math.ceil(dt.getTime() / coeff) * coeff; // Round up to nearest 30 mins and convert to ms
    return new Date(roundedMs);
  }

};

/**
 * Validate Routines
 * Note: This only validates properties that can be set through the UI
 * All other properties will be validated by the server.
 * @type {Object}
 */
Event_Calendar.Validate = {

  validateProperty: function validateProperty(prop, val) {
    if(prop == "freq") {
      return this.validateFreq(val);
    } else if (prop == "interval") {
      return this.validateInterval(val);
    } else if (prop == "dtstart") {
      return this.validateDtstart(val);
    } else if (prop == "dtend") {
      return this.validateDtend(val);
    } else if (prop == "byday") {
      return this.validateByday(val);
    } else if (prop == "bymonthday") {
      return this.validateBymonthday(val);
    } else if (prop == "bymonth") {
      return this.validateBymonth(val);
    } else if(prop == "bysetpos") {
      return this.validateBysetpos(val);
    } else if (prop == "count") {
      return this.validateCount(val);
    } else if (prop == "until") {
      return this.validateUntil(val);
    } else if(prop == "rrule") {
      return this.validateRRule(val);
    } else if (prop == "summary") {
      return this.validateSummary(val);
    } else if (prop == "description") {
      return this.validateDescription(val);
    } 
    return new Event_Calendar.Errors.UnknownPropertyError("", prop);
  },

  validateIsoDateString : function validateIsoDateString(d) {
    return typeof d == "string" && 
    ( (d.search(Event_Calendar.Cfg.ISO_DATE_REGEX) > -1) || (d.search(Event_Calendar.Cfg.ISO_DATETIME_REGEX) > -1) ) && 
    moment(d).isValid();
  },

  validateDtstart : function validateDtstart(dtstart) {
    if(!this.validateIsoDateString(dtstart)) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.INVALID_DATE_ERR_MSG, "dtstart");
    }
    if(+new Date(dtstart) < +new Date("01/01/1970")) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.DTSTART_TOO_OLD_ERR_MSG, "dtstart");
    }
    return true;
  },

  validateDtend : function validateDtend(dtend) {
    if(!this.validateIsoDateString(dtend)) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.INVALID_DATE_ERR_MSG, "dtend");
    }
    return true;
  },

  validateSummary : function validateSummary(sum) {
    if(sum.length > 64) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.SUMMARY_ERROR, "summary");
    }
    return true;
  },

  validateDescription : function validateDescription(desc) {
    if(desc.length > 256) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.DESCRIPTION_ERROR, "description");
    }
    return true;
  },

  validateFreq : function validateFreq(freq) {
    if(Event_Calendar.Cfg.FREQ_VALUES.indexOf(freq) === -1) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.FREQ_ERR_MSG, "freq");
    }
    return true;
  },

  validateInterval : function validateInterval(interval) {
    if(!Event_Calendar.Helpers.isInteger(interval) || interval < 1) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.INTERVAL_ERR_MSG, "interval");
    }
    return true;
  },

  validateCount : function validateCount(count) {
    if((!Event_Calendar.Helpers.isInteger(count) || count < 1)) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.COUNT_ERR_MSG, "count");
    }
    return true;
  },

  validateUntil : function validateUntil(until) {
    if(!this.validateIsoDateString(until)) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.INVALID_DATE_ERR_MSG, "until");
    }
    return true;
  },

  validateByday : function validateByday(byday) {
    function validate(day) {
      return day.search(Event_Calendar.Cfg.BYDAY_REGEX) > -1;
    }
    if(Array.isArray(byday)) {
      if(byday.length === 0 || !_.every(byday, function(day) { return validate(day);})) {
        return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.BYDAY_ERR_MSG, "byday");
      }
    }
    else {
      if(!validate(byday)) {
        return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.BYDAY_ERR_MSG, "byday");
      }
    }
    return true;
  },

  validateBymonth : function validateBymonth(bymonth) {
    if(!Array.isArray(bymonth) || bymonth.length < 1 || !_.every(bymonth, function(month) { return Event_Calendar.Helpers.isInteger(month) && typeof month === "number" && (month >= 1 && month <= 12); })) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.BYMONTH_ERR_MSG, "bymonth");
    }
    return true;
  },

  validateBymonthday : function validateBymonthday(bymonthday) {
    if(!Array.isArray(bymonthday) || bymonthday.lengh < 1 || !_.every(bymonthday, function(md) { return Event_Calendar.Helpers.isInteger(md) && (md >= 1 && md <= 31); })) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.BYMONTHDAY_ERR_MSG, "bymonthday");
    }
    return true;
  },

  validateBysetpos : function validateBysetpos(bysetpos) {
    if(!Event_Calendar.Helpers.isInteger(bysetpos) || !(bysetpos ===  -1 || (bysetpos >= 1 && bysetpos <= 4))) {
      return new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.BYSETPOS_ERR_MSG, "bysetpos");
    }
    return true;
  },

  /**
   * Validate RRULE
   * @param  {Object} r rrule properties
   * @return {Array} Returns array of errors. Empty array if none. 
   */
  validateRRule : function validateRRule(r) {
    var errors = [], ctx = this;
    if( !("freq" in r) ) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.FREQ_REQUIRED_ERR_MSG, "freq"));
    }
    if( !("interval" in r) ) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.INTERVAL_REQUIRED_ERR_MSG, "interval"));
    }
    Object.keys(r).forEach(function(prop) {
      var ret = ctx.validateProperty(prop, r[prop]);
      if(ret instanceof Error) {
        errors.push(ret);
      }
    });
    if(r.count && r.until) {
      errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.COUNT_AND_UNTIL_ERR_MSG, "count"));
    }
    if( r.freq && r.freq == "yearly" && Array.isArray(r.bymonth) && r.bymonth.length > 1 && Array.isArray(r.byday) && r.byday.length > 1) {
      errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.MULT_MONTHS_AND_OCC_ERR_MSG, "bymonth"));
    }
    return errors;
  },

  validateEvent : function validateEvent(e) {
    var ctx = this;
    var errors = [];
    var rrule = _.pick(e, Event_Calendar.Cfg.REPEAT_PROPERTIES);
    var everythingElse =  _.omit(e, Event_Calendar.Cfg.REPEAT_PROPERTIES);
    // Required Fields
    if( !("dtstart" in everythingElse) ) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.DTSTART_REQUIRED_ERR_MSG, "dtstart"));
    }
    if( !("dtend" in everythingElse) ) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.DTEND_REQUIRED_ERR_MSG, "dtend"));
    }
    // Validate individual properties
    if(Object.keys(rrule).length > 0) { errors = errors.concat(this.validateRRule(rrule)); }
    Object.keys(everythingElse).forEach(function(prop){
      var ret = ctx.validateProperty(prop, e[prop]);
      if(ret instanceof Error) {
        errors.push(ret);
      }
    });
    // Multi-field validation
    if(e.dtstart && e.dtend && moment(e.dtend).isBefore(moment(e.dtstart))) {
      errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.END_BEFORE_START_ERR_MSG, "dtend"));
    }
    if(e.dtstart && e.until && (+new Date(e.dtstart) >= +new Date(e.until)) ) {
      errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.END_BEFORE_START_ERR_MSG, "until"));
    }
    return errors.length > 0 ? new Event_Calendar.Errors.ErrorGroup("", errors) : true;
  }

};

/**
 * Templates
 * @type {Object}  
*/
Event_Calendar.Templates = {
  "basic_inputs": "<div class=\"basic-inputs\"><div class=\"save-button-row row\"> <button class=\"save-button\" title=\"Save\">Save</button></div><div class=\"title-row row\"> <label>Title</label> <input type=\"text\" title=\"Event Title\" class=\"summary\" /></div><div class=\"date-row row\"> <label>Start/End</label> <span class=\"dtstart-group\"><span class=\"dtstart-prefix prefix\">From</span> <input type=\"date\" title=\"From Date\" class=\"dtstart-date\" min=\"1970-01-01\"/> <span class=\"dtstart-separator separator\">at</span> <input type=\"time\" title=\"From Time\" class=\"dtstart-time\" /></span> <span class=\"dtend-group\"><span class=\"dtend-prefix prefix\">To</span> <input type=\"date\" title=\"To Date\" class=\"dtend-date\" /> <span class=\"dtend-separator separator\">at</span> <input type=\"time\" title=\"To Time\" class=\"dtend-time\" min=\"1970-01-01\"/></span></div><div class=\"allday-row row\"> <label>All Day <input type=\"checkbox\" title=\"All Day\" class=\"allday\" /></label></div><div class=\"repeat-row row\"> <label>Repeat <input type=\"checkbox\" title=\"Repeat\" class=\"repeatEnabled\" /><span class=\"editRepeatSettings\"></span></label></div><div class=\"location-row row\"> <label>Location</label> <input type=\"text\" title=\"Event Location\" class=\"location\" /></div><div class=\"description-row row\"> <label>Description</label><textarea class=\"description\"></textarea></div></div>",
  "entry_container": "<div class=\"edit-event-container\"><div class=\"basic-inputs-container\"></div><div class=\"repeat-settings-container\"></div></div>",
  "monthly_inputs": "<div class='row monthday-numeric-row'> <label><input type=\"radio\" name=\"active-monthday-type\" class=\"monthday-numeric-active\" checked /> Each:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label><div class='monthday-container'><div class='pushbutton-container'></div></div></div><div class='row monthday-occurrence-row'> <label><input type=\"radio\" name=\"active-monthday-type\" class=\"monthday-occurrence-active\" /> On the:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label> <select class='monthday-occurrence-number' disabled><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select><div class='monthday-container'><div class='select-container'> <select class='monthday-weekday-dropdown' disabled><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div></div></div>",
  "persistent_repeat_inputs": "<div class=\"content\"> <button class=\"close\">&#xd7;</button><h3 class=\"title\">Repeat Settings</h3><div class='freq-row row'> <label>Repeats:<a class='inlineHelp' data-help='The unit of time used to determine how often the event should repeat e.g. monthly. Defaults to \"never\".'><i class='icon-question-sign'></i></a></label> <select class='freq'><option value='daily'>Daily</option><option value='weekly'>Weekly</option><option value='monthly'>Monthly</option><option value='yearly'>Yearly</option></select><div class='nextOccurrence'></div></div><div class='interval-row row'> <label>Every:<a class='inlineHelp' data-help='This value works with the \"repeats\" unit of time to determine how often the event will repeat e.g. 2 with \"monthly\" means every 2 months. Defaults to 1 if you leave this blank.'><i class='icon-question-sign'></i></a></label> <input type='number' class='interval' min='1' pattern=\"\\d*\"/><span class='intervalTimeUnit'></span></div><div class=\"variable-content-row row\"></div><div class='dtstart-row row'> <label>Starting:<a class='inlineHelp' data-help='The date and time the event starts repeating. You should make this the date and time you want the event to initially appear.'><i class='icon-question-sign'></i></a></label> <input type='text' class='dtstart' disabled/></div><div class='end-row row'> <label>Ending:<a class='inlineHelp' data-help='These buttons allow you to choose when the event should stop repeating. Choose \"After\" if you want to limit the event to a certain number of occurrences. Choose \"Until\" if you want the event to stop repeating on a specific date and time.'><i class='icon-question-sign'></i></a></label><div class=\"end-type\"><div> <label><input type=\"radio\" name=\"end-type\" class=\"never-rb\" /> <span class=\"prefix\">Never</span></label></div><div> <label><input type=\"radio\" name=\"end-type\" class=\"count-rb\" /> <span class=\"prefix\">After</span></label> <input type=\"number\" class=\"count\" min=\"1\" pattern=\"\\d*\" disabled/> <span class=\"suffix\">occurrence(s)</span></div><div> <label><input type=\"radio\" name=\"end-type\" class=\"until-rb\" /> <span class=\"prefix\">On</span></label> <input type=\"date\" class=\"until\" disabled/></div></div></div><div class=\"repeat-settings\"></div><div class='button-row row'> <button class='ok'>Ok</button> &nbsp; <button class='cancel'>Cancel</button></div></div>",
  "quick_entry_inputs": "<div class=\"dtstart-group\"><h2>Start Date</h2><div class=\"dtstart-inputs\"> <input class=\"ds-date\" title=\"From date\"> <input class=\"ds-time\" title=\"From time\"></div></div><div class=\"dtend-group\"><h2>End Date</h2><div class=\"dtend-inputs\"> <input class=\"de-date\" title=\"End date\"> <input class=\"de-time\" title=\"End time\"></div></div><div class=\"summary-group\"><h2>Summary</h2><div class=\"summary\"><textarea class=\"summary\"></textarea></div></div><div class=\"submit-button\"></div>",
  "weekly_inputs": "<div class='weekday-row row'> <label>On:<a class='inlineHelp' data-help='Use this value if the event needs to repeat on one or more days of the week e.g. Monday and Wednesday.'><i class='icon-question-sign'></i></a></label><div class='weekday-container pushbutton-container'></div></div>",
  "yearly_inputs": "<div class='year-month-row row'> <label>In:<a class='inlineHelp' data-help='You can limit the months the event will repeat in by selecting one or more months.'><i class='icon-question-sign'></i></a></label><div class='year-month-container pushbutton-container'></div></div><div class='year-day-row row'> <label><input type=\"checkbox\" class=\"year-day-occurrence-active\"/> On:<a class='inlineHelp' data-help='Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third fourth or last day of the week that will appear in a drop down menu to the right.'><i class='icon-question-sign'></i></a></label> <select class='yearday-occurrence-number' disabled><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select> <select class='yearday-drop-down' disabled><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div>"
};

/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  /**
   * Private Properties
   */
  var cfg,
      container,
      controller,
      data,
      savedState,
      v = Event_Calendar.Validate;

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(cont, ctrl, values) {
    cfg = Event_Calendar.Cfg;
    container = cont;
    controller = ctrl;
    data = {};
    savedState = null;
    values = values || defaultValues();
    this.set(values);
  }

  function publish(evtType, data) {
    postal.publish({
      topic: "ecmodel." + evtType,
      data: data || {}
    });
    return data;
  }

  function subscribe(topic, callback) {
    postal.subscribe({
      topic: topic,
      callback: callback
    });
  }

  /**
   * Diff : Calculate changes since the last time state was saved
   * Goal is to identify: 
   *  1. Properties that are not in data that are in savedState
   *  2. Properties that are not in savedState but are in data
   *  3. Properties that are in both objects but have different values
   * @return {Object} Object containing properties that are "different" (see goal above)
  */
  function diff() {
    if(!savedState) return;
    var tempData = JSON.parse(JSON.stringify(data));
    var tempSavedState = JSON.parse(JSON.stringify(savedState));
    // Values from saved state that do not exist in data
    // 1. Properties that are not in data that are in savedState
    //    Set to falsy to indicate that the property has been changed and should be removed
    var old = _.pick(tempSavedState, _.difference(Object.keys(tempSavedState), Object.keys(tempData)));
    Object.keys(old).forEach(function(key){old[key] = typeof old[key] === "string" ? "" : null;});
    //  2. Properties that are not in savedState but are in data
    //  3. Properties that are in both objects but have different values
    var d = _.omit(tempData, function(v,k) { return tempSavedState[k] === v; });
    return _.extend(d, old);
  }

  function defaultValues() {
    var dtstart = moment(Event_Calendar.Helpers.roundDateToNearestHalfHour(new Date())).format(cfg.MOMENT_DATE_TIME_FORMAT);
    var dtend = moment(dtstart).add(1, "hour").format(cfg.MOMENT_DATE_TIME_FORMAT);
    return {
      dtstart: dtstart,
      dtend: dtend
    };
  }

  // Translates data into form appropriate for storage
  function formatTransition(attrs) {
    if( attrs.interval ) {
      attrs.interval = parseInt(attrs.interval, 10);
    }
    if( attrs.count ) {
      attrs.count = parseInt(attrs.count, 10);
    }
    if( attrs.until ) {
      var dtstart = moment(data.dtstart);
      attrs.until = moment(attrs.until).hours(dtstart.hours()).minutes(dtstart.minutes()).format(cfg.MOMENT_DATE_TIME_FORMAT);
      attrs.until = Event_Calendar.Helpers.convertDateTimeStrToUTC(attrs.until);
    }
    return attrs;
  }

  /**
   * API
   */
  Model.prototype = {

    toggleAllDay : function toggleAllDay(isAllDay) {
      var dtstart, dtend, roundedNow;
      if(isAllDay) {
        dtstart = moment(this.getProperty("dtstart")).format(cfg.MOMENT_DATE_FORMAT);
        dtend = moment(this.getProperty("dtend")).format(cfg.MOMENT_DATE_FORMAT);
      } else {
        roundedNow = moment(Event_Calendar.Helpers.roundDateToNearestHalfHour(new Date()));
        dtstart = moment(this.getProperty("dtstart")).hour(roundedNow.hour()).minute(roundedNow.minute()).format(cfg.MOMENT_DATE_TIME_FORMAT);
        dtend = moment(this.getProperty("dtend")).hour(roundedNow.hour()).minute(roundedNow.minute()).format(cfg.MOMENT_DATE_TIME_FORMAT);
      }
      this.set({dtstart: dtstart, dtend: dtend});
    },
    
    /**
     * Get data
     */
    getSavedState : function getSavedState() {
      return _.extend({}, savedState);
    },

    getProperty : function getProperty(prop) {
      return _.clone(data[prop]);
    },

    getEvent : function getEvent() {
      return _.extend({}, data);
    },

    getRepeatProperties : function getRepeatProperties() {
      return _.pick(data, Event_Calendar.Cfg.REPEAT_PROPERTIES);
    },

    /**
     * Set Data
     */
     
    set : function set(key, val) {
      var attr, attrs, prev, previousAttributes, curr, currentAttributes, changes, ret;
      if (key === null) return this;
      container.trigger("model.set", [key, val]); // Enables error removal from DOM
      // Allow both (key, value) and ({key: value}) arguments
      if (typeof key === "object") {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }
      attrs = formatTransition(attrs);
      if(_.intersection(Event_Calendar.Cfg.REPEAT_PROPERTIES, Object.keys(attrs)).length > 0) {
        return this.setRepeatProperties(attrs);
      }
      changes = [];
      prev = this.getEvent();
      curr = this.getEvent();
      for(attr in attrs) {
        val = attrs[attr];
        if ( !_.isEqual(prev[attr], val) ) {
          changes.push(attr);
          curr[attr] = val;
        }
      }
      ret = v.validateEvent(curr);
      if(ret instanceof Error) {
        container.trigger("model.error", ret);
      } else {
        data = curr;
        changes.forEach(function(attr) {
          if( (cfg.REPEAT_PROPERTIES.indexOf(attr) > -1) ) {
            container.trigger("model.change", [attr, this.getRepeatProperties()]);
          } else {
            container.trigger("model.change", [attr, curr[attr]]);
          }
        });
      }
      return this;
    },

    setEvent : function setEvent(evt) {
      if(!evt) return;
      evt = _.pick(evt, _.identity); // Only allow properties that have a truthy value
      var temp = _.extend({}, data, evt);
      if(!temp.freq) temp = _.omit(temp, cfg.REPEAT_PROPERTIES);
      Object.keys(temp).forEach(function(key){temp[key] = formatTransition(key, temp[key]);});
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length > 0) {
        var err = new Event_Calendar.Errors.ErrorGroup(null, validationErrors);
        return publish("event_set_error", err);
      } 
      // Success!
      data = temp;
      return publish("event_set", this.getEvent());
    },

    setRepeatProperties : function setRepeatProperties(props) {
      var temp = _.extend({}, _.omit(data, cfg.REPEAT_PROPERTIES), props);
      temp = formatTransition(temp);
      var ret = v.validateEvent(temp);
      if(ret instanceof Error) {
        container.trigger("model.error", ret);
        return this;
      }
      data = temp;
      container.trigger("model.change", ["rrule", this.getRepeatProperties()]);
      return this;
    },

    /**
     *  Remove data
     */
    removeProperty : function removeProperty(prop) {
      prop = Array.isArray(prop) ? prop : [prop];
      prop.forEach(function(p){
        if(typeof data[p] !== "undefined") {
          delete data[p];
          // Can't have an RRule w/o a freq
          if(p == "freq") {
            data = _.omit(data, cfg.REPEAT_PROPERTIES);
          }
        }
      });
      container.trigger("model.removed", prop);
      return this;
    },

    removeRepeatProperties : function removeRepeatProperties() {
      this.removeProperty("freq"); // This will remove all repeat properties
    },

    /**
     * Save
     */
    save : function save() {
      // Insert save to server code here.
      // if(!savedState) savedState = _.extend({}, temp);
      // return publish("saved", getEvent());
    }
  };

  return Model;

})();
/**
 * Event Entry Controller
 */
Event_Calendar.Entry = (function(){
  "use strict";

  var model,
      container,
      bi,         // basic inputs
      biCnt,      // basic inputs container
      rs,         // repeat setting inputs
      rsCnt,      // repeat settings container
      eh;         // error handler

  /**
   * Event Entry Constructor
   * @param {Object} evt An object containing event properties
   */
  function Entry(containerSelector, values) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Entry(): Unable to locate container");
    }
    container.html(Event_Calendar.Templates.entry_container);
    biCnt = $(".basic-inputs-container");
    rsCnt = $(".repeat-settings-container");
    eh = new Event_Calendar.ErrorHandler(biCnt, rsCnt, container);
    model = new Event_Calendar.Model(container, this, values);
    bi = new Event_Calendar.Basic_Inputs(biCnt, this, model, container);
    bi.render(model.getEvent());
    rs = new Event_Calendar.Repeat_Settings(rsCnt, container, model);
    rs.render();
  }

  /**
   * Private Functions
   */
  

  /**
   * API 
   */
  Entry.prototype = {

    /**
     * Render inputs
     */
    setEvent : function setEvent(values) {
      var res = model.setEvent(values);
      if(res instanceof Error) {
        // Pass errors to all views
      }
      else {
        return true;
      }
    },

    toggleRepeatSettings : function toggleRepeatSettings(evt){
      rs.toggleRepeatSettings(evt);
    }
    
  };

  return Entry;

})();

/**
 * Event Basic Inputs
 * @return {Function} Model contructor function
 */

Event_Calendar.Basic_Inputs = (function(){
  "use strict";

  var allDayInput,
      cfg,
      container,
      controller,
      descriptionInput,
      dtendDateInput,
      dtendTimeInput,
      dtstartDateInput,
      dtstartTimeInput,
      locationInput,
      model,
      rootContainer,
      repeatEnabledInput,
      summaryInput;

  // -----------------------------------------------
  // 
  //  Constructor
  //  
  // -----------------------------------------------
  
  function Basic_Inputs(cnt, ctrl, md, rootCnt, values) {
    container = cnt;
    cfg = Event_Calendar.Cfg;
    controller = ctrl;
    model = md;
    rootContainer = rootCnt;
    if(values) {
      setValues(values);
    }
  }

  // -----------------------------------------------
  // 
  //  Initialization
  //  
  // -----------------------------------------------
  
  function initInputReferences() {
    summaryInput = $("input.summary", container);
    dtstartDateInput = $("input.dtstart-date", container);
    dtendDateInput = $("input.dtend-date", container);
    dtstartTimeInput = $("input.dtstart-time", container);
    dtendTimeInput = $("input.dtend-time", container);
    allDayInput = $("input.allday", container);
    repeatEnabledInput = $("input.repeatEnabled", container);
    locationInput = $("input.location", container);
    descriptionInput = $("textarea.description", container);
  }

  function initInputs(values) {
    // Date fields
    [dtstartDateInput, dtendDateInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoDatePicker({
          parseFormats: cfg.KENDO_DATE_PARSE_FORMATS,
          format: cfg.KENDO_DATE_DISPLAY_FORMAT,
          min: new Date("01/01/1970"),
          change: setModelValue
        });
      }
    });
    // Time fields
    [dtstartTimeInput, dtendTimeInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoTimePicker({
          change: setModelValue
        });
      }
    });
  }

  function initEvents() {
    container.off();
    container.on("change", "input:not(.allday,.repeat,.k-input),textarea", setModelValue);
    container.on("change", ".allday", allDayChange);
    container.on("change", ".repeatEnabled", repeatEnabledChange);
    container.on("click", ".save-button", save);
    rootContainer.on("model.change", modelChangeHandler);
    rootContainer.on("repeatSettingsModalClosed", repeatSettingsModalClosed);
  }

  // -----------------------------------------------
  // 
  //  Events
  //  
  // -----------------------------------------------

  function setModelValue(evt) {
    var tgt = $(evt.target || evt.sender.element), kendo, val;
    console.log("setModelValue() tgt: ", tgt);
    if (tgt.is(".summary")) {
      model.set("summary", tgt.val());
    } else if(tgt.is(".dtstart-date,.dtstart-time")) {
      setDtstartInModel();
    } else if(tgt.is(".dtend-date,.dtend-time")) {
      setDtendInModel();
      //model.set("dtend", tgt.val());
    } else if (tgt.is(".location")){
      model.set("location", tgt.val());
    } else if (tgt.is(".description")){
      model.set("description", tgt.val());
    }
    console.log("setModelValue()...new model val: ", model.getEvent());
  }

  function setDtstartInModel() {
    var dtstart = getDtstart();
    var dtend = getDtend();
    var format = isAllDay() ? cfg.MOMENT_DATE_FORMAT : cfg.MOMENT_DATE_TIME_FORMAT;
    // obj so dtstart and dtend can be set together if necessary. Otherwise
    // if dtend needs to be updated but dtstart is set first the event won't
    // pass validation when dtstart is set.
    var upd = {dtstart: dtstart}; 
    if(dtstart && dtend) {
      if(moment(dtend).isBefore(moment(dtstart))) {
        var newDate = isAllDay() ? moment(dtstart) : moment(dtstart).add(1, "hour");
        upd.dtend = newDate.format(format);
      }
    }
    model.set(upd);
  }

  function setDtendInModel() {
    model.set("dtend", getDtend());
  }

  function allDayChange() {
    if(allDayInput.is(":checked")) {
      $(".dtstart-time").hide(); // have to use jquery selector because of kendo
      $(".dtend-time").hide();
    } else {
      $(".dtstart-time").show();
      $(".dtend-time").show();
    }
    //model.toggleAllDay(allDayInput.is(":checked"));
  }

  function repeatEnabledChange(evt) {
    repeatEnabledInput.trigger("repeatEnabledToggled");
  }

  function modelChangeHandler(evt, prop, val) {
    setProperty(prop, val);
  }

  function repeatSettingsModalClosed(evt, repeatSettingsPresent) {
    repeatEnabledInput.prop("checked", repeatSettingsPresent);
  }

  // -----------------------------------------------
  // 
  //  Get data
  //  
  // -----------------------------------------------
  
  function getSummary() {
    return summaryInput.val();
  }

  function getDtstart() {
    var dt = getDtstartDate();
    var time = getDtstartTime();
    var format = isAllDay() ? cfg.MOMENT_DATE_FORMAT : cfg.MOMENT_DATE_TIME_FORMAT;
    return (dt && time) ? moment(dt + "T" + time).format(format) : "";
  }

  function getDtstartDate() {
    return getDateInputVal(dtstartDateInput);
  }

  function getDtstartTime() {
    return getTimeInputVal(dtstartTimeInput);
  }

  function getDtend() {
    var dt = getDtendDate();
    var time = getDtendTime();
    var format = isAllDay() ? cfg.MOMENT_DATE_FORMAT : cfg.MOMENT_DATE_TIME_FORMAT;
    return (dt && time) ? moment(dt + "T" + time).format(format) : "";
  }

  function getDtendDate() {
    return getDateInputVal(dtendDateInput);
  }

  function getDtendTime() {
    return getTimeInputVal(dtendTimeInput);
  }

  function getLocation() {
    return locationInput.val();
  }

  function getDescription() {
    return descriptionInput.val();
  }

  function getValues() {
    return {
      summary : getSummary(),
      dtstart : getDtstart(),
      dtend : getDtend(),
      location : getLocation(),
      description: getDescription()
    };
  }

  function getTimeInputVal(input) {
    var kendo = input.data("kendoTimePicker");
    var val = kendo ? kendo.value() : input[0].value;
    return val ? moment(val).format(cfg.MOMENT_24_HR_TIME_FORMAT) : "";
  }

  function getDateInputVal(input) {
    var kendo = input.data("kendoDatePicker"), val;
    val = kendo ? kendo.value() : input[0].value;
    return val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
  }


  // -----------------------------------------------
  // 
  //  Set data
  //  
  // -----------------------------------------------
  
  function setProperty(prop, val) {
    if(prop == "summary") {
      setSummary(val);
    } else if(prop == "dtstart") {
      setDtstartDate(val);
      setDtstartTime(val);
    } else if(prop == "dtend") {
      setDtendDate(val);
      setDtendTime(val);
    } else if (prop == "location") {
      setLocation(val);
    } else if (prop == "description") {
      setDescription(val);
    }
  }

  function setSummary(summary) {
    summaryInput.val(summary || "");
  }

  function setDtstart(dtstart) {
    setDtstartDate(dtstart);
    setDtstartTime(dtstart);
  }

  function setDtstartDate(dtstart) {
    setDateField(dtstartDateInput, dtstart);
  }

  function setDtstartTime(dtstart) {
    setTimeField(dtstartTimeInput, dtstart);
  }

  function setDtend(dtend) {
    setDtendDate(dtend);
    setDtendTime(dtend);
  }

  function setDtendDate(dtend) {
    setDateField(dtendDateInput, dtend);
  }

  function setDtendTime(dtend) {
    setTimeField(dtendTimeInput, dtend);
  }
  
  function setLocation(loc) {
    locationInput.val(loc || "");
  }

  function setDescription(desc) {
    descriptionInput.val(desc || "");
  }

  function setValues(values) {
    values = values || {};
    setSummary(values.summary || "");
    setDtstartDate(values.dtstart);
    setDtstartTime(values.dtstart);
    setDtendDate(values.dtend);
    setDtendTime(values.dtend);
    setLocation(values.location || "");
    setDescription(values.description || "");
  }

  function setDateField(input, val) {
    var kendo = input.data("kendoDatePicker");
    val = val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
    if(kendo) {
      kendo.value(val);
    } else {
      untilInput[0].value = val;
    }
  }

  function setTimeField(input, value) {
    var kendoTimePicker = input.data("kendoTimePicker");
    if(kendoTimePicker) {
      value =  value ? moment(value).format(Event_Calendar.Cfg.MOMENT_12_HR_TIME_FORMAT) : "";
      kendoTimePicker.value(value);
    }
    else {
      value = value ? moment(value).format(Event_Calendar.Cfg.MOMENT_24_HR_TIME_FORMAT) : "";
      input[0].value = value;
    }
  }

  // -----------------------------------------------
  // 
  //  Misc
  //  
  // -----------------------------------------------

  function isAllDay() {
    return allDayInput.is(":checked");
  }

  // -----------------------------------------------
  // 
  //  Render
  //  
  // -----------------------------------------------

  function render() {
    container.html(Event_Calendar.Templates.basic_inputs);
    initInputReferences();
    initInputs();
    setValues(model.getEvent());
    initEvents();
  }

  function save() {
    console.log("save(): ", getValues());
  }

  /**
   * API 
   */
  Basic_Inputs.prototype = {

    render : render
    
  };

  return Basic_Inputs;

})();

/**
 * Event Repeat Settings
 * @return {Function} Repeat settings constructor function
 */
Event_Calendar.Repeat_Settings = (function(){
  "use strict";

  var activeMonthdayTypeGroup,
      cancelBtn,
      cfg,
      closeBtn,
      container,
      countInput,
      debouncedResize,
      dtstartInput,
      endAfterRadio,
      endNeverRadio,
      endTypeGroup,
      endUntilRadio,
      freqInput,
      intervalInput,
      intervalTimeUnit,
      model,
      monthdayNumericActiveRb,
      monthdayOccurrenceActiveRb,
      monthDayOccurrenceNumberDropDown,
      monthdayWeekdayDropdown,
      okBtn,
      pb,
      rootContainer,
      savedState,
      untilInput,
      variableContentContainer,
      yearDayDropDown,
      yearDayOccurrenceNumberDropDown,
      yearWeekdayOccurrenceActiveCb;

  // -----------------------------------------------
  // 
  //  Constructor
  //  
  // -----------------------------------------------

  function Repeat_Settings(cnt, rootCnt, md) {
    container = cnt;
    cfg = Event_Calendar.Cfg;
    model = md;
    rootContainer = rootCnt;
  }


  // -----------------------------------------------
  // 
  //  Initialization
  //  
  // -----------------------------------------------

  function initInputReferences() {
    closeBtn = $( ".close", container);
    cancelBtn = $( ".cancel", container);
    okBtn = $( ".ok", container);
    freqInput = $(".freq", container);
    intervalInput = $(".interval", container);
    intervalTimeUnit = $(".intervalTimeUnit", container);
    dtstartInput = $(".dtstart", container);
    endTypeGroup = $("input[name=end-type]");
    endNeverRadio = $(".never-rb", container);
    endAfterRadio = $(".count-rb", container);
    endUntilRadio = $(".until-rb", container);
    countInput = $(".count", container);
    untilInput = $(".until", container);
  }

  function initUntil() {
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      untilInput.attr("type", "text").kendoDatePicker({
        parseFormats: cfg.KENDO_DATE_PARSE_FORMATS,
        format: cfg.KENDO_DATE_DISPLAY_FORMAT,
        min: new Date("01/01/1970"), 
        enabled: false,
        change: simpleChange
      });
    }
  }
  
  function initInputs() {
    initUntil();
  }

  function initEvents() {
    if(debouncedResize) { $(window).off("resize", debouncedResize); }
    debouncedResize = _.debounce(addAppropriateModalClass, 500);
    $(window).on("resize", debouncedResize);
    closeBtn.off().on("click", toggleModal);
    cancelBtn.off().on("click", cancelChanges);
    okBtn.off().on("click", save);
    endTypeGroup.off().on("change", endTypeChange);
    freqInput.off().on("change", freqChange);
    intervalInput.off().on("change", simpleChange);
    countInput.off().on("change", simpleChange);
    rootContainer.on("model.change", modelChange);
    rootContainer.on("repeatEnabledToggled", repeatEnabledToggled);
  }

  // -----------------------------------------------
  // 
  //  Events
  //  
  // -----------------------------------------------
  
  function modelChange(evt, prop, val) {
    if(prop == "rrule") {
      setValues(val);
    }
  }

  function toggleRepeatSettings(evt) {
    toggleModal(evt);
  }

  function freqChange(evt) {
    var values = {
      freq : getFreq(),
      interval : 1
    };
    values = _.extend(values, getEndTypeValue());
    updateModel(values);
  }

  function endTypeChange(evt) {
    var freq = getFreq(), numOcc, unitOfTime, until;
    if ( freq == "daily" ) {
      numOcc = 5;           // 5 days
      unitOfTime = "days";
    } else if ( freq == "weekly") {
      numOcc = 24;          // 24 weeks aka 6 months
      unitOfTime = "weeks";
    } else if (freq == "monthly") {
      numOcc = 12;          // 12 months
      unitOfTime = "months";
    } else if (freq == "yearly") {
      numOcc = 5;           // 5 years
      unitOfTime = "years";
    }
    setCount("");
    setUntil("");
    if(endAfterRadio.is(":checked")) {
      disableUntil();
      countInput.prop("disabled", false);
      setCount(numOcc);
      updateModel();
    }
    else if(endUntilRadio.is(":checked")) {
      countInput.prop("disabled", true);
      enableUntil();
      until = moment(model.getProperty("dtstart")).add(numOcc, unitOfTime).format(cfg.MOMENT_DATE_FORMAT);
      setUntil(until);
      updateModel();   
    }
    else {
      countInput.prop("disabled", true);
      disableUntil();
      model.removeProperty(["count", "until"]);
    }
  }

  function simpleChange(evt) {
    updateModel();
  }

  function monthlyInputTypeChange(evt) {
    if(monthdayNumericActiveRb.is(":checked")) {
      resetSelectMenu(monthDayOccurrenceNumberDropDown);
      resetSelectMenu(monthdayWeekdayDropdown);
      disableMonthlyOccurrenceMenus();
      var bymonthday = [parseInt(moment(model.getProperty("dtstart")).format("D"))];
      pb.enable();
      updateModel();
    }
    else {
      //pb.set([]);
      enableMonthlyOccurrenceMenus();
      pb.disable();
      updateModel();
    }
  }

  function variableDataChange(evt) {
    updateModel();
  }

  function updateModel(values) {
    model.set(values || getValues());
    console.log("After model update: ", model.getEvent());
  }

  function save(evt) {
    updateModel();
    savedState = model.getEvent();
    // toggleModal()
    //console.log("REPEAT SETTINGS: ", getValues());
    console.log("MODEL: ", model.getEvent());
  }


  // -----------------------------------------------
  // 
  //  Get Values
  //  
  // -----------------------------------------------
  
  function getFreq() {
    return freqInput.val();
  }
  
  function getInterval() {
    return intervalInput.val();
  }

  function getEndTypeValue() {
    if(endAfterRadio.is(":checked")) {
      return {count: getCount()};
    }
    if(endUntilRadio.is(":checked")) {
      return {until: getUntil()};
    }
    return {};
  }

  function getCount() {
    return countInput.val();
  }

  function getUntil() {
    var kendo = untilInput.data("kendoDatePicker");
    var val = kendo ? kendo.value() : untilInput[0].value;
    return val ? moment(val).format(cfg.MOMENT_DATE_TIME_FORMAT) : "";
  }

  function getWeeklyValues() {
    // Only need byday if the user selected multiple days or they
    // selected a single day that is not equal to the dtstart day.
    // Otherwise we can rely on the rrule generating occurrences on the dtstart day
    var byday = pb.getSelectedData();
    if(byday.length > 0) {
      var dtstartDay = moment(model.getProperty("dtstart")).format("dd").toLowerCase();
      if(byday.length > 1 || byday.indexOf(dtstartDay) == -1) {
        return byday;
      }
    }
  }

  function getMonthlyValues(values) {
    var ret = {};
    if(monthdayNumericActiveRb.is(":checked")) {
      var bymonthday = pb.getSelectedData();
      var dtstartday = parseInt(moment(model.getProperty("dtstart")).format("D"));
      // multiple days or single day != dtstart day
      if(bymonthday.length > 0 && (bymonthday.length > 1 || bymonthday[0] != dtstartday)) {
        ret.bymonthday = bymonthday;
      }
      return ret;
    }
    else if(monthdayOccurrenceActiveRb.is(":checked")) {
      return getDayOccurrenceValue(values);
    }
  }

  function getYearlyValues() {
    var ret = {};
    var bymonth = pb.getSelectedData().map(function(n){ return parseInt(n, 10); });
    var dtstartmon = moment(model.getProperty("dtstart")).format("M");
    // multiple months or single month !== dtstart month
    if(bymonth.length > 0 && (bymonth.length > 1 || bymonth[0] != dtstartmon)) {
      ret.bymonth = bymonth;
    }
    if(yearWeekdayOccurrenceActiveCb.is(":checked")) {
      ret = _.extend(ret, getDayOccurrenceValue());
    }
    return ret;
  }

  function getDayOccurrenceValue() {
    var freq = getFreq();
    var num = freq == "monthly" ? monthDayOccurrenceNumberDropDown.val()
                                : yearDayOccurrenceNumberDropDown.val();
    var byday = null, bysetpos = null, ret = {};
    
    if(!num) { return ret; }
    num = parseInt(num, 10);
    byday = freq == "monthly" ? monthdayWeekdayDropdown.val()
                              : yearDayDropDown.val();
    if (byday == "weekday") {
      bysetpos = num;
      byday = cfg.WEEKDAYS;
    }
    else if (byday == "weekendday") {
      bysetpos = num;
      byday = cfg.WEEKEND_DAYS;
    }
    else if(byday == "day") {
      bysetpos = num;
      byday = cfg.DAYS_OF_THE_WEEK;
    }
    else if(cfg.DAYS_OF_THE_WEEK.indexOf(byday) > -1) {
      byday = num + byday; // converts to string
    }
    if(bysetpos) ret.bysetpos = bysetpos;
    if(byday) ret.byday = byday;
    return ret;
  }

  function getValues() {
    var values = {
      freq : getFreq(),
      interval : getInterval()
    };
    switch(values.freq) {
      case "weekly" :
        var byday = getWeeklyValues();
        if ( byday ) values.byday = byday;
        break;
      case "monthly" :
        values = _.extend(values, getMonthlyValues());
        break;
      case "yearly" :
        values = _.extend(values, getYearlyValues());
        break;
      default :
    }
    values = _.extend(values, getEndTypeValue());
    return values;
  }

  // -----------------------------------------------
  // 
  //  Set Values
  //  
  // -----------------------------------------------
  
  function setValues(values) {
    setPersistentValues(values);
    setVariableValues(values);
  }

  function setPersistentValues(values) {
    var freq = values.freq || "daily";
    setFreq(freq);
    setInterval(values.interval || 1);
    setDtstart(values.dtstart);
    if(values.count) {
      setEndType("count", values.count);
    } else if(values.until) {
      setEndType("until", values.until);
    } else {
      setEndType("never");
    }
  }

  function setVariableValues(values) {
    if(!values.freq || values.freq == "daily") {
      renderVariableContent("daily");
    } else if(values.freq == "weekly") {
      renderVariableContent(values.freq);
      pb.set(values.byday || [moment(values.dtstart).format("dd").toLowerCase()]);
    } else if (values.freq == "monthly") {
      if(!values.bysetpos && !values.byday) {
        renderVariableContent("monthly");
      } else {
        renderVariableContent("monthly", true);
      }
      setMonthly(values);
    } else if (values.freq == "yearly") {
      renderVariableContent("yearly");
      setYearly(values);
    }
  }

  function setFreq(freq) {
    freqInput.val(freq || "");
  }

  function setInterval(interval) {
    interval = interval || 1;
    intervalInput.val(interval);
    var timeUnit = "";
    var freq = getFreq();
    if(freq == "daily") {
      timeUnit = " " + cfg.DAILY_INTERVAL_TIME_UNIT;
    } else if(freq == "weekly") {
      timeUnit = " " + cfg.WEEKLY_INTERVAL_TIME_UNIT;
    } else if (freq == "monthly") {
      timeUnit = " " + cfg.MONTHLY_INTERVAL_TIME_UNIT;
    } else if (freq == "yearly") {
      timeUnit = " " + cfg.YEARLY_INTERVAL_TIME_UNIT;
    }
    intervalTimeUnit.text(timeUnit);
  }

  function setDtstart(dtstart) {
    var val = moment(dtstart).format(cfg.MOMENT_DATE_DISPLAY_FORMAT);
    dtstartInput.val(val);
  }

  function setNumericMonthday(bymonthday) {
    disableMonthlyOccurrenceMenus();
    monthdayNumericActiveRb.prop("checked", true);
    pb.enable();
    pb.set(bymonthday);
  }

  function setMonthdayOccurrence(occurrenceNumber, day) {
    pb.disable();
    monthdayOccurrenceActiveRb.prop("checked", true);
    enableMonthlyOccurrenceMenus();
    monthDayOccurrenceNumberDropDown.val(occurrenceNumber);
    monthdayWeekdayDropdown.val(day);
  }

  function setMonthly(values) {
    var occurrenceNumber, day;
    // No monthly data present
    if(!values.bymonthday && !values.bysetpos && !values.byday) {
      // use moment instead of date to avoid conversion to local time zone
      setNumericMonthday([parseInt(moment(values.dtstart).format("D"))]);
    }
    // One or more numeric month days
    if(values.bymonthday) {
      setNumericMonthday(values.bymonthday);
    }
    // An instance of a single-day occurrence e.g. "1su" (first sunday)
    if(values.byday && !values.bysetpos) {
      var match = values.byday.match(cfg.DAY_OCCURRENCE_REGEX);
      occurrenceNumber = match[1];
      day = match[2];
      setMonthdayOccurrence(occurrenceNumber, day);
    }
    // Instance of a multi-day occurrence e.g first weekendday
    if(values.byday && values.bysetpos) {
      occurrenceNumber = values.bysetpos;
      if(values.byday.length == cfg.WEEKEND_DAYS.length) {
        day = "weekendday";
      } else if (values.byday.length == cfg.WEEKDAYS.length) {
        day = "weekday";
      } else {
        day = "day";
      }
      setMonthdayOccurrence(occurrenceNumber, day);
    }
  }

  function setYearly(values) {
    pb.set(values.bymonth || [new Date(model.getProperty("dtstart")).getMonth() + 1]);
    // Instance of a multi-day occurrence e.g first weekendday
    if(values.bysetpos && values.byday) {
      if(values.byday.length === 2) {
        yearDayDropDown.val("weekendday");
      }
      else if (values.byday.length === 5) {
        yearDayDropDown.val("weekday");
      }
      else {
        yearDayDropDown.val("day");
      }
      yearDayOccurrenceNumberDropDown.val(values.bysetpos);
      enableYearlyOccurrenceMenus();
    }
    // An instance of a single-day occurrence e.g. "1su" (first sunday)
    else if(values.byday) {
      var match = values.byday.match(cfg.DAY_OCCURRENCE_REGEX); // "1su" means year day occurrence
      yearDayOccurrenceNumberDropDown.val(match[1]);
      yearDayDropDown.val(match[2]);
      enableYearlyOccurrenceMenus();
    }
    // Month(s) chosen only...reset occurrence menus
    else {
      disableYearlyOccurrenceMenus();
    }
  }

  function setEndType(endType, value) {
    if(!endType || endType == "never") {
      endNeverRadio.prop("checked", true);
      setCount("");
      setUntil("");
    } else if(endType == "count") {
      endAfterRadio.prop("checked", true);
      setCount(value);
    } else if(endType == "until") {
      endUntilRadio.prop("checked");
      setUntil(value);
    }
  }

  function disableUntil() {
    var kendo = untilInput.data("kendoDatePicker");
    if(kendo) {
      kendo.enable(false);
    } else {
      untilInput.prop("disabled", true);
    }
  }

  function enableUntil() {
    var kendo = untilInput.data("kendoDatePicker");
    if(kendo) {
      kendo.enable(true);
    } else {
      untilInput.prop("disabled", false);
    }
  }

  function setUntil(val) {
    var kendo = untilInput.data("kendoDatePicker");
    val = val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
    if(kendo) {
      kendo.value(val);
    } else {
      untilInput[0].value = val;
    }
  }

  function setCount(val) {
    countInput.val(val);
  }

  // -----------------------------------------------
  // 
  //  Render
  //  
  // -----------------------------------------------
  
  function renderWeeklyFreq() {
    variableContentContainer.html(Event_Calendar.Templates.weekly_inputs);
    pb = new Event_Calendar.PushButtons(".pushbutton-container");
    pb.render({
      numCols: 7,
      buttonWidth: 25,
      buttonHeight: 25,
      data: [{text: "SU", value: "su"},{text: "MO", value: "mo"},{text: "TU", value: "tu"},{text: "WE", value: "we"},{text: "TH", value: "th"},{text: "FR", value: "fr"},{text: "SA", value: "sa"}]
    });
    variableContentContainer.off().on("pushButtonSelected pushButtonDeselected", variableDataChange);
  }

  function renderMonthlyFreq() {
    variableContentContainer.html(Event_Calendar.Templates.monthly_inputs);
    activeMonthdayTypeGroup = $("input[name=active-monthday-type]");
    activeMonthdayTypeGroup.on("change", monthlyInputTypeChange);
    monthdayNumericActiveRb = $(".monthday-numeric-active", container);
    monthdayOccurrenceActiveRb = $(".monthday-occurrence-active", container);
    monthDayOccurrenceNumberDropDown = $(".monthday-occurrence-number", container);
    monthdayWeekdayDropdown = $(".monthday-weekday-dropdown", container);
    pb = new Event_Calendar.PushButtons(".pushbutton-container");
    pb.render({
      numCols: 7,
      buttonWidth: 25,
      buttonHeight: 25,
      data: [
        {text: 1, value: 1},{text: 2, value: 2},{text: 3, value: 3},
        {text: 4, value: 4},{text: 5, value: 5},{text: 6, value: 6},
        {text: 7, value: 7},{text: 8, value: 8},{text: 9, value: 9},
        {text: 10, value: 10},{text: 11, value: 11},{text: 12, value: 12},
        {text: 13, value: 13},{text: 14, value: 14},{text: 15, value: 15},
        {text: 16, value: 16},{text: 17, value: 17},{text: 18, value: 18},
        {text: 19, value: 19},{text: 20, value: 20},{text: 21, value: 21},
        {text: 22, value: 22},{text: 23, value: 23},{text: 24, value: 24},
        {text: 25, value: 25},{text: 26, value: 26},{text: 27, value: 27},
        {text: 28, value: 28},{text: 29, value: 29},{text: 30, value: 30},
        {text: 31, value: 31}
      ]
    });
    $(".monthday-occurrence-number, .monthday-weekday-dropdown").off().on("change", variableDataChange);
    variableContentContainer.off().on("pushButtonSelected pushButtonDeselected", variableDataChange);
  }

  function renderYearlyFreq() {
    variableContentContainer.html(Event_Calendar.Templates.yearly_inputs);
    yearDayDropDown = $(".yearday-drop-down", container);
    yearDayOccurrenceNumberDropDown = $(".yearday-occurrence-number", container);
    yearWeekdayOccurrenceActiveCb = $(".year-day-occurrence-active", container);
    yearWeekdayOccurrenceActiveCb.on("change", function(){
      if(yearWeekdayOccurrenceActiveCb.is(":checked")) {
        enableYearlyOccurrenceMenus();
      } else {
        disableYearlyOccurrenceMenus();
      }
      updateModel();
    });
    pb = new Event_Calendar.PushButtons(".pushbutton-container");
    pb.render({
      numCols: 6,
      buttonWidth: 28,
      buttonHeight: 28,
      data: [
        {text: "Jan", value: 1},{text: "Feb", value: 2},{text: "Mar", value: 3},
        {text: "Apr", value: 4},{text: "May", value: 5},{text: "Jun", value: 6},
        {text: "Jul", value: 7},{text: "Aug", value: 8},{text: "Sep", value: 9},
        {text: "Oct", value: 10},{text: "Nov", value: 11},{text: "Dec", value: 12}
      ]
    });
    $(".yearday-occurrence-number, .yearday-drop-down").off().on("change", variableDataChange);
    variableContentContainer.off().on("pushButtonSelected pushButtonDeselected", variableDataChange);
  }

  function renderVariableContent (freq, monthlyDayOfWeek) {
    freq = freq || "";
    if(freq == "daily") {
      variableContentContainer.html("");
    } else if(freq == "weekly") {
      renderWeeklyFreq();
    } else if(freq == "monthly") {
      renderMonthlyFreq();
    } else if(freq == "yearly") {
      renderYearlyFreq();
    } else {
      variableContentContainer.html("");
    }
  }

  function render() {
    container.html(Event_Calendar.Templates.persistent_repeat_inputs);
    variableContentContainer = $(".variable-content-row", container);
    addAppropriateModalClass();
    initInputReferences();
    initInputs();
    setValues(model.getEvent());
    initEvents();
  }

  // -----------------------------------------------
  // 
  //  Misc
  //  
  // -----------------------------------------------
  
  function supportsTransitions() {
    return Modernizr.csstransitions;
  }

  function resetSelectMenu(menu) {
    $("option:first-child", menu).attr("selected", "selected");
  }

  function disableMonthlyOccurrenceMenus() {
    monthDayOccurrenceNumberDropDown.prop("disabled", true);
    monthdayWeekdayDropdown.prop("disabled", true);
  }

  function enableMonthlyOccurrenceMenus() {
    monthDayOccurrenceNumberDropDown.prop("disabled", false);
    monthdayWeekdayDropdown.prop("disabled", false);
  }

  function disableYearlyOccurrenceMenus() {
    resetSelectMenu(yearDayOccurrenceNumberDropDown);
    resetSelectMenu(yearDayDropDown);
    yearDayOccurrenceNumberDropDown.prop("disabled", true);
    yearDayDropDown.prop("disabled", true);
  }

  function enableYearlyOccurrenceMenus() {
    yearWeekdayOccurrenceActiveCb.prop("checked", true);
    yearDayOccurrenceNumberDropDown.prop("disabled", false);
    yearDayDropDown.prop("disabled", false);
  }

  // -----------------------------------------------
  // 
  //  Modal stuff
  //  
  // -----------------------------------------------
  function addAppropriateModalClass() {
    var modal = container,
      windowClass = cfg.MODAL_WINDOW_CLASS,
      slidedownClass = cfg.MODAL_SLIDEDOWN_CLASS,
      viewportWidth = document.documentElement.clientWidth;
    if( viewportWidth > cfg.SM_SCREEN_BREAKPOINT ) {
      modal.removeClass(slidedownClass).addClass(windowClass);
    } else {
      modal.removeClass(windowClass).addClass(slidedownClass);
    }
  }

  function toggleModal(evt) {
    var modal = container,
    showClass = cfg.SHOW_MODAL_CLASS;
    if(modal.hasClass( showClass ) ) {
      modal.removeClass( showClass );
      var rsPresent = Object.keys(model.getRepeatProperties()).length > 0;
      rootContainer.trigger("repeatSettingsModalClosed", [rsPresent]);
    }
    else {
      modal.addClass( showClass );
      setValues(model.getEvent());
    }
  }

  function repeatEnabledToggled(evt) {
    if($(evt.target).is(":checked")) {
      toggleModal();
    } else {
      model.removeRepeatProperties();
    }
  }

  function cancelChanges(evt) {
    if(savedState) {
      updateModel(savedState);
    } else {
      model.removeRepeatProperties();
    }
    toggleModal();
  }

  
  // -----------------------------------------------
  // 
  //  API
  //  
  // -----------------------------------------------
  Repeat_Settings.prototype = {

    render : render,

    toggleRepeatSettings : toggleRepeatSettings  
  };

  return Repeat_Settings;

})();

/**
 * Push Buttons
 */
Event_Calendar.PushButtons = (function(){
  "use strict";

  var container,
      buttonElement = "td:not(.filler)",
      selectedData = [];


  function PushButtons(containerSelector){
    container = $(containerSelector);
    if(container.length === 0) {
      console.error("PushButtons(): Unable to locate container.");
    }
    initEvents();
  }

  function initEvents () { 
    container.off("click", buttonElement).on("click", buttonElement, buttonClicked);
  }

  function disable() {
    container.off("click", buttonElement);
    $(".pushButtonsTable", container).addClass("disabled");
  }

  function enable() {
    initEvents();
    $(".pushButtonsTable", container).removeClass("disabled");
  }
  
  function buttonClicked (evt) {
    evt.preventDefault();
    var target = $(evt.target);
    var val = target.data("value");
    if(target.hasClass("selected")) {
      removeSelectedData(val);
      target.removeClass("selected");
      container.trigger("pushButtonDeselected", val);
    }
    else {
      addSelectedData(val);
      target.addClass("selected");
      container.trigger("pushButtonSelected", val);
    }
  }

  function findCell(d) {
    return $("td", container).filter(function(){
      return $(this).data("value") == d;
    }).eq(0);
  }

  function set(data) {
    removeAllData();
    (data || []).forEach(function(d){
      var cell = findCell(d);
      if(cell) {
        addSelectedData(d);
        cell.addClass("selected");
      }
    });
    container.trigger("pushButtonDataLoaded", selectedData);
  }

  function addSelectedData(val) {
    if(typeof val == "undefined" || !val) { return; }
    selectedData.push(val);
  }

  function removeAllData() {
    $("td.selected", container).removeClass("selected");
    selectedData = [];
    container.trigger("pushButtonsDataRemoved", selectedData);
  }

  function removeSelectedData(val) {
    if(typeof val == "undefined" || !val) { return; }
    var idx = selectedData.indexOf(val);
    if(idx > -1) {
      selectedData.splice(idx, 1);
    }
  }

  function getSelectedData() {
    return JSON.parse(JSON.stringify(selectedData));
  }

  /**
   * Render pushbuttons
   * @param  {Object} opts Render options. Possible values are:
   *   opts.numCols -> Number of columns
   *   opts.buttonWidth -> Width of a button
   *   opts.buttonHeight -> Height of a button
   *   opts.data -> The data to render
   * @return {undefined}
   */
  function render(opts) {
    opts = opts || {};
    opts.numCols = opts.numCols || 7;
    opts.buttonWidth = opts.buttonWidth || 25;
    opts.buttonHeight = opts.buttonHeight || 25;
    opts.data = opts.data || [];
    if(opts.data.length === 0) {
      return;
    }
    var table = $("<table cellspacing='0' class='pushButtonsTable'></table>");
    var row = $("<tr></tr>");
    table.append(row);
    var i, l, colCounter, cell;
    for(i = 0, l = opts.data.length, colCounter = 1; i < l; ++i, ++colCounter) {
      cell = $("<td>" + opts.data[i].text + "</td>");
      cell.data("value", opts.data[i].value);
      cell.css({width: opts.buttonWidth + "px", height: opts.buttonHeight + "px"});
      row.append(cell);
      if(i < (opts.data.length - 1) && colCounter >= opts.numCols) {
        row = $("<tr></tr>");
        colCounter = 0;
        table.append(row);
      }
    }
    if(colCounter <= opts.numCols) {
      cell = $("<td class='filler' colspan='" + (opts.numCols - colCounter + 1) + "'></td>");
      row.append(cell);
    }
    container.html(table);
  }

  var api = {
    render : render,
    set : set, 
    getSelectedData : getSelectedData,
    enable : enable,
    disable: disable
  };

  PushButtons.prototype = api;

  return PushButtons;

})();
