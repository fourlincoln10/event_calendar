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
  FREQ_VALUES                 : ["daily", "weekly", "monthly", "yearly"],
  BYDAY_VALUES                : ["su", "mo", "tu", "we", "th", "fr", "sa", "day", "weekday", "weekendday"],
  BYDAY_REGEX                 : /^(-?[1-4]?)(su|mo|tu|we|th|fr|sa)$/, // /^(-?[1-4]?)([a-z]+)/
  BY_MONTH_VALUES             : ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
  FIELDS_MANAGED_BY_VIEW      : ["dtstart", "dtend", "freq","interval", "byday","bymonthday","bymonth","bysetpos","count","until", "summary", "description"],
  REPEAT_PROPERTIES           : ["freq","interval","byday","bymonthday","bymonth","bysetpos","count","until"],
  UID_REGEX                   : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  ISO_DATETIME_REGEX          : /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5](\d:[0-5])?\dZ?$/,
  ISO_DATE_REGEX              : /^\d{4}-[01]\d-[0-3]\d$/,
  MOMENT_DATE_FORMAT          : "YYYY-MM-DD",
  MOMENT_24_HR_TIME_FORMAT    : "HH:mm",
  MOMENT_12_HR_TIME_FORMAT    : "hh:mm A",
  MOMENT_DATE_TIME_FORMAT     : "YYYY-MM-DDTHH:mm",
  MOMENT_DATE_DISPLAY_FORMAT  : "MM/DD/YYYY",
  FREQ_ERR_MSG                : "You must choose never,daily,weekly,monthly or yearly",
  INTERVAL_ERR_MSG            : "Must be empty or an integer >= 1",
  DTSTART_ERR_MSG             : "Please enter a valid date > 01/01/1970. Format: mm/dd/yyyy hh:mm AM|PM",
  DTSTART_REQUIRED_ERR_MSG    : "Start date is required",
  DTEND_REQUIRED_ERR_MSG      : "End date is required",
  END_BEFORE_START_ERR_MSG    : "End date must be after start date",
  DTSTART_TOO_OLD_ERR_MSG     : "Start date too far in past",
  COUNT_ERR_MSG               : "Must be empty or an integer >= 1",
  UNTIL_ERR_MSG               : "Please enter a valid date: mm/dd/yyyy hh:mm AM|PM",
  COUNT_AND_UNTIL_ERR_MSG     : "count and until cannot both be specified",
  BYDAY_ERR_MSG               : "Invalid byday",
  BYMONTHDAY_ERR_MSG          : "Must be an integer between 1 and 31 (inclusive)",
  BYMONTH_ERR_MSG             : "Must be an integer between 1 and 12 (inclusive)",
  BYSETPOS_ERR_MSG            : "Must be between 1 and 4 (inclusive) or -1",
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
   Error.captureStackTrace(this);
   this.message = msg || "Invalid";
   this.eventProperty = eventProp || "";
}
InvalidError.prototype = Object.create(Error.prototype);


function UnknownPropertyError(msg, eventProp) {
   Error.captureStackTrace(this);
   this.message = msg || "Unknown Property";
   this.eventProperty = eventProp || "";
}
UnknownPropertyError.prototype = Object.create(Error.prototype);


function RequiredError(msg, eventProp) {
   Error.captureStackTrace(this);
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
   Error.captureStackTrace(this);
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
    } else if (prop == "repeatType") {
      return this.validateRepeatType(val);
    } 
    return false;
  },

  validateIsoDateString : function validateIsoDateString(d) {
    return typeof d == "string" && 
    ( (d.search(Event_Calendar.Cfg.ISO_DATE_REGEX) > -1) || (d.search(Event_Calendar.Cfg.ISO_DATETIME_REGEX) > -1) ) && 
    moment(d).isValid();
  },

  validateRepeatType : function validateRepeatType(rt) {
    return typeof rt == "string" && (rt === "simple" || rt === "custom");
  },

  validateDtstart : function validateDtstart(dtstart) {
    return this.validateIsoDateString(dtstart) && (+new Date(dtstart) > +new Date("01/01/1970"));
  },

  validateDtend : function validateDtend(dtend) {
    return this.validateIsoDateString(dtend);
  },

  validateSummary : function validateSummary(sum) {
    return typeof sum === "string";
  },

  validateDescription : function validateDescription(desc) {
    return typeof desc === "string";
  },

  validateFreq : function validateFreq(freq) {
    return typeof freq == "string" && Event_Calendar.Cfg.FREQ_VALUES.indexOf(freq) > -1;
  },

  validateInterval : function validateInterval(interval) {
    return typeof interval !== "undefined" && Event_Calendar.Helpers.isInteger(interval) && interval >= 1;
  },

  validateCount : function validateCount(count) {
    return typeof count !== "undefined" && Event_Calendar.Helpers.isInteger(count) && count > 0;
  },

  validateUntil : function validateUntil(until) {
    return this.validateIsoDateString(until);
  },

  validateByday : function validateByday(byday) {
    if(typeof byday == "undefined") return;
    function validate(day) {
      return day.search(Event_Calendar.Cfg.BYDAY_REGEX) > -1;
    }
    if(Array.isArray(byday)) {
      return byday.length > 0 &&
             _.every(byday, function(day) { return validate(day);});
    }
    return validate(byday);
  },

  validateBymonth : function validateBymonth(bymonth) {
    return typeof bymonth !== "undefined" && Array.isArray(bymonth) && bymonth.length > 0 && _.every(bymonth, function(month) {
      return Event_Calendar.Helpers.isInteger(month) && typeof month === "number" && (month >= 1 && month <= 12);
    });
  },

  validateBymonthday : function validateBymonthday(bymonthday) {
    return  typeof bymonthday !== "undefined" &&
            Array.isArray(bymonthday) &&
            bymonthday.length > 0 &&
            _.every(bymonthday, function(md) {
              return Event_Calendar.Helpers.isInteger(md) && (md >= 1 && md <= 31);
            });
  },

  validateBysetpos : function validateBysetpos(bysetpos) {
    return  typeof bysetpos !== "undefined" &&
            Event_Calendar.Helpers.isInteger(bysetpos) &&
            (bysetpos ===  -1 || (bysetpos >= 1 && bysetpos <= 4));
  },

  /**
   * Validate RRULE
   * @param  {Object} r rrule properties
   * @return {Array} Returns array of errors. Empty array if none. 
   */
  validateRRule : function validateRRule(r) {
    var errors = [], ctx = this;
    Object.keys(r).forEach(function(prop){
      if(!ctx.validateProperty(prop, r[prop])) {
        var reason = typeof Event_Calendar.Cfg[prop.toUpperCase() + "_ERR_MSG"] !== "undefined" ? Event_Calendar.Cfg[prop.toUpperCase() + "_ERR_MSG"] : "Unknown error";
        errors.push(new Event_Calendar.Errors.InvalidError(reason, prop));
      }
    });
    if(!r.freq) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.FREQ_ERR_MSG, "freq"));
    }
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
    var everythingElse =  _.pick(e, _.difference(Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW, Event_Calendar.Cfg.REPEAT_PROPERTIES));
    // Required Fields
    if(!everythingElse.dtstart) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.DTSTART_REQUIRED_ERR_MSG, "dtstart"));
    }
    if(!everythingElse.dtend) {
      errors.push(new Event_Calendar.Errors.RequiredError(Event_Calendar.Cfg.DTEND_REQUIRED_ERR_MSG, "dtend"));
    }
    // Validate individual properties
    if(Object.keys(rrule).length > 0) { errors = errors.concat(this.validateRRule(rrule)); }
    Object.keys(everythingElse).forEach(function(prop){
      if(!ctx.validateProperty(prop, e[prop])) {
        var reason = typeof Event_Calendar.Cfg[prop.toUpperCase() + "_ERR_MSG"] !== "undefined" ? Event_Calendar.Cfg[prop.toUpperCase() + "_ERR_MSG"] : "Unknown error";
        errors.push(new Event_Calendar.Errors.InvalidError(reason, prop));
      }
    });
    // Multi-field validation
    if(e.dtstart && e.until && (+new Date(e.dtstart) >= +new Date(e.until)) ) {
      errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.END_BEFORE_START_ERR_MSG, "until"));
    }
    return errors;
  }

};

/**
 * Templates
 * @type {Object}  
*/
Event_Calendar.Templates = {
  "basic_inputs": "<div class=\"basic-inputs\"><div class=\"save-button-row row\"> <button class=\"save-button\" title=\"Save\">Save</button></div><div class=\"title-row row\"> <label>Title</label> <input type=\"text\" title=\"Event Title\" class=\"summary\" /></div><div class=\"date-row row\"> <label>Start/End</label> <span class=\"dtstart-group\"><span class=\"dtstart-prefix prefix\">From</span> <input type=\"date\" title=\"From Date\" class=\"dtstart-date\" /> <span class=\"dtstart-separator separator\">at</span> <input type=\"time\" title=\"From Time\" class=\"dtstart-time\" /></span> <span class=\"dtend-group\"><span class=\"dtend-prefix prefix\">To</span> <input type=\"date\" title=\"To Date\" class=\"dtend-date\" /> <span class=\"dtend-separator separator\">at</span> <input type=\"time\" title=\"To Time\" class=\"dtend-time\" /></span></div><div class=\"allday-row row\"> <label>All Day <input type=\"checkbox\" title=\"All Day\" class=\"allday\" /></label></div><div class=\"repeat-row row\"> <label>Repeat <input type=\"checkbox\" title=\"Repeat\" class=\"repeat\" /><span class=\"repeat-msg\"></span></label></div><div class=\"location-row row\"> <label>Location</label> <input type=\"text\" title=\"Event Location\" class=\"location\" /></div><div class=\"description-row row\"> <label>Description</label><textarea class=\"description\"></textarea></div></div>",
  "entry_container": "<div class=\"edit-event-container\"><div class=\"basic-inputs-container\"></div><div class=\"repeat-settings-container\"></div></div>",
  "monthly_freq_day_of_week": "<div class='monthday-row row'> <label><input type=\"radio\" class=\"monthday-occurence-active\"/> On:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label> <select class='monthday-occurrence-number'><option value='day'>Day</option><option value='' disabled='disabled'></option><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select><div class='monthday-container'><div class='select-container'> <select class='month-day-dropdown'><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div></div></div>",
  "monthly_freq_numeric_day": "<div class='row monthday-numeric-row'> <label><input type=\"radio\" name=\"active-monthday-type\" class=\"monthday-occurence-active\" checked /> Each:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label><div class='monthday-container'><div class='pushbutton-container'></div></div></div><div class='row monthday-occurrence-row'> <label><input type=\"radio\" name=\"active-monthday-type\" class=\"monthday-occurence-active\" /> On the:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label> <select class='monthday-occurrence-number' disabled><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select><div class='monthday-container'><div class='select-container'> <select class='month-day-dropdown' disabled><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div></div></div>",
  "persistent_repeat_inputs": "<div class=\"content\"> <button class=\"close\">&#xd7;</button><h3 class=\"title\">Repeat Settings</h3><div class='freq-row row'> <label>Repeats:<a class='inlineHelp' data-help='The unit of time used to determine how often the event should repeat e.g. monthly. Defaults to \"never\".'><i class='icon-question-sign'></i></a></label> <select class='freq'><option value='daily'>Daily</option><option value='weekly'>Weekly</option><option value='monthly'>Monthly</option><option value='yearly'>Yearly</option></select><div class='nextOccurrence'></div></div><div class='interval-row row'> <label>Every:<a class='inlineHelp' data-help='This value works with the \"repeats\" unit of time to determine how often the event will repeat e.g. 2 with \"monthly\" means every 2 months. Defaults to 1 if you leave this blank.'><i class='icon-question-sign'></i></a></label> <input type='number' class='interval' min='1' pattern=\"\\d*\"/><span class='intervalTimeUnit'></span></div><div class=\"variable-content-row row\"></div><div class='dtstart-row row'> <label>Starting:<a class='inlineHelp' data-help='The date and time the event starts repeating. You should make this the date and time you want the event to initially appear.'><i class='icon-question-sign'></i></a></label> <input type='text' class='dtstart' /></div><div class='end-row row'> <label>Ending:<a class='inlineHelp' data-help='These buttons allow you to choose when the event should stop repeating. Choose \"After\" if you want to limit the event to a certain number of occurrences. Choose \"Until\" if you want the event to stop repeating on a specific date and time.'><i class='icon-question-sign'></i></a></label><div class=\"end-type\"> <label><input type=\"radio\" name=\"end-type\" class=\"never-rb\" /> <span class=\"prefix\">Never</span></label> <label><input type=\"radio\" name=\"end-type\" class=\"count-rb\" /> <span class=\"prefix\">After</span> <input type=\"number\" class=\"count\" min=\"1\" pattern=\"\\d*\"/> <span class=\"suffix\">occurrence(s)</span></label> <label><input type=\"radio\" name=\"end-type\" class=\"until-rb\" /> <span class=\"prefix\">On</span></label> <input type=\"date\" class=\"until\"/></div></div><div class=\"repeat-settings\"></div><div class='button-row row'> <button class='ok'>Ok</button> &nbsp; <button class='cancel'>Cancel</button></div></div>",
  "quick_entry_inputs": "<div class=\"dtstart-group\"><h2>Start Date</h2><div class=\"dtstart-inputs\"> <input class=\"ds-date\" title=\"From date\"> <input class=\"ds-time\" title=\"From time\"></div></div><div class=\"dtend-group\"><h2>End Date</h2><div class=\"dtend-inputs\"> <input class=\"de-date\" title=\"End date\"> <input class=\"de-time\" title=\"End time\"></div></div><div class=\"summary-group\"><h2>Summary</h2><div class=\"summary\"><textarea class=\"summary\"></textarea></div></div><div class=\"submit-button\"></div>",
  "weekly_freq_day_of_week": "<div class='weekday-row row'> <label>On:<a class='inlineHelp' data-help='Use this value if the event needs to repeat on one or more days of the week e.g. Monday and Wednesday.'><i class='icon-question-sign'></i></a></label><div class='weekday-container pushbutton-container'></div></div>",
  "yearly_freq_month_selection": "<div class='year-month-row row'> <label>In:<a class='inlineHelp' data-help='You can limit the months the event will repeat in by selecting one or more months.'><i class='icon-question-sign'></i></a></label><div class='year-month-container pushbutton-container'></div></div><div class='year-day-row row'> <label><input type=\"checkbox\" class=\"year-day-occurrence-active\"/> On:<a class='inlineHelp' data-help='Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third fourth or last day of the week that will appear in a drop down menu to the right.'><i class='icon-question-sign'></i></a></label> <select class='yearday-occurrence-number' disabled><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select> <select class='yearday-drop-down' disabled><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div>"
};

/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  /**
   * Private Properties / Functions
   */
  var v = Event_Calendar.Validate;
  var data, savedState;

  function publish(evtType, data) {
    postal.publish({
      topic: "model." + evtType,
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

  function roundDateToNearestHalfHour(dt) {
    var coeff = 1000 * 60 * 30; // 1000 ms/sec * 60 sec/min * 30 min/1 = 1800000 ms.
    var roundedMs = Math.ceil(dt.getTime() / coeff) * coeff; // Round up to nearest 30 mins and convert to ms
    return new Date(roundedMs);
  }

  function defaultValues() {
    var defaults = {
      freq: "daily", 
      interval: 1,
      dtstart: moment(roundDateToNearestHalfHour(new Date())).format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT),
    };
    defaults.dtend = moment(defaults.dtstart).add(1, "hour").format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT);
    return defaults;
  }

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(values){
    data = {};
    values = values || defaultValues();
    savedState = null;
    this.setEvent(values);
  }

  /**
   * API
   */
  Model.prototype = {
    
    /**
     * Get data
     */
    getSavedState : function getSavedState() {
      return _.extend({}, savedState);
    },

    getProperty : function getProperty(prop) {
      return data[prop];
    },

    getEvent : function getEvent() {
      return _.extend({}, data);
    },

    /**
     * Set Data
     */
    setProperty : function setProperty(prop, val) {
      var err;
      if(Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW.indexOf(prop) === -1) {
        err = new Event_Calendar.Errors.UnknownPropertyError("Unknown property", prop);
        return publish("error", err);
      }
      // If setting to "", null etc. remove instead
      if(!prop) {
        return this.removeProperty(prop);
      }
      if(!v.validateProperty(prop, val)) {
        err = new Event_Calendar.Errors.InvalidError("Invalid " + prop, prop);
        return publish("error", err);
      }
      // Validate event as a whole so errors involving multiple properties are caught.
      var e = this.getEvent();
      e[prop] = val;
      var validationErrors = v.validateEvent(e);
      if(validationErrors.length > 0) {
        err = new Event_Calendar.Errors.ErrorGroup("", validationErrors);
        return publish("error", err);
      }
      data[prop] = val;
      return publish("updated", e);
    },

    setEvent : function setEvent(evt) {
      publish("setevent");
      if(!evt) return;
      evt = _.pick(evt, _.identity); // Only allow properties that have a truthy value
      var temp = _.extend({}, data, evt);
      if(!temp.freq) temp = _.omit(temp, Event_Calendar.Cfg.REPEAT_PROPERTIES);
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length === 0) {
        data = temp;
        if(!savedState) savedState = _.extend({}, temp);
        return publish("updated", this.getEvent());
      } 
      else {
        var err = new Event_Calendar.Errors.ErrorGroup(null, validationErrors);
        return publish("error", err);
      }
    },

    setRepeatProperties : function setRepeatProperties(props) {
      var temp = _.extend({}, data, props);
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length === 0) {
        data = temp;
        if(!savedState) savedState = _.extend({}, temp);
        return this.getEvent();
      } 
      else {
        return new Event_Calendar.Errors.ErrorGroup(null, validationErrors);
      }

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
            data = _.omit(data, Event_Calendar.Cfg.REPEAT_PROPERTIES);
          }
        }
      });
      return publish("updated", this.getEvent());
    },

    removeRepeatProperties : function removeRepeatProperties() {
      removeProperty("freq"); // This will remove all repeat properties
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
      bi,
      rs;

  /**
   * Event Entry Constructor
   * @param {Object} evt An object containing event properties
   */
  function Entry(containerSelector, values) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Entry(): Unable to locate container");
    }
    model = new Event_Calendar.Model(values);
    container.html(Event_Calendar.Templates.entry_container);
    bi = new Event_Calendar.Basic_Inputs(".basic-inputs-container", this, model);
    bi.render(values);
    rs = new Event_Calendar.Repeat_Settings(".repeat-settings-container", this, model);
    rs.render();
    initEvents();
  }

  /**
   * Private Functions
   */
  function initEvents() {
    // Set up the events we are going to listen to
    container.off();
    container.on("pushButtonSelected", function(){console.log("pushButtonSelected");});
    container.on("pushButtonDeselected", function(){console.log("pushButtonDeselected");});
  }
  

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

  var controller,
      container,
      model,
      summaryInput,
      dtstartDateInput,
      dtstartTimeInput,
      dtendDateInput,
      dtendTimeInput,
      allDayInput,
      repeatInput,
      locationInput,
      descriptionInput;

  /**
   * Basic Inputs Constructor
   * @param {Object} evt An object containing event properties
   */
  function Basic_Inputs(containerSelector, contr, md) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = contr;
    model = md;
  }

  /**
   * Private Functions
   */
  function initInputReferences() {
    summaryInput = $("input.summary", container);
    dtstartDateInput = $("input.dtstart-date", container);
    dtendDateInput = $("input.dtend-date", container);
    dtstartTimeInput = $("input.dtstart-time", container);
    dtendTimeInput = $("input.dtend-time", container);
    allDayInput = $("input.allday", container);
    repeatInput = $("input.repeat", container);
    locationInput = $("input.location", container);
    descriptionInput = $("textarea.description", container);
  }

  function initInputs(values) {
    // Date fields
    [dtstartDateInput, dtendDateInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoDatePicker({
          parseFormats: ["yyyy-MM-dd"],
          format: "MM/dd/yyyy",
          min: new Date("01/01/1970")
        });
      }
    });
    // Time fields
    [dtstartTimeInput, dtendTimeInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoTimePicker({});
      }
    });
  }

  function setSummary(summary) {
    summaryInput.val(summary);
  }

  function setDateField(input, value) {
    var kendoDatePicker = input.data("kendoDatePicker");
    if(kendoDatePicker) {
      kendoDatePicker.value(value);
    }
    else {
      input[0].valueAsDate = value;
    }
  }

  function setDtstartDate(dtstart) {
    setDateField(dtstartDateInput, dtstart);
  }

  function setDtendDate(dtend) {
    setDateField(dtendDateInput, dtend);
  }

  function setTimeField(input, value) {
    var kendoTimePicker = input.data("kendoTimePicker");
    if(kendoTimePicker) {
      value = moment(value).format(Event_Calendar.Cfg.MOMENT_12_HR_TIME_FORMAT);
      kendoTimePicker.value(value);
    }
    else {
      value = moment(value).format(Event_Calendar.Cfg.MOMENT_24_HR_TIME_FORMAT);
      input[0].value = value;
    }
  }
  
  function setDtstartTime(dtstart) {
    setTimeField(dtstartTimeInput, dtstart);
  }

  function setDtendTime(dtend) {
    setTimeField(dtendTimeInput, dtend);
  }

  function setLocation(loc) {
    locationInput.val(loc);
  }

  function setDescription(desc) {
    descriptionInput.val(desc);
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

  function initEvents() {
    repeatInput.off().on("click", function(evt){controller.toggleRepeatSettings(evt);});
  }

  /**
   * API 
   */
  Basic_Inputs.prototype = {

    /**
     * Render inputs
     */
    render : function render() {
      container.html(Event_Calendar.Templates.basic_inputs);
      initInputReferences();
      initInputs();
      setValues(model.getEvent());
      initEvents();
    }
    
    
  };

  return Basic_Inputs;

})();

/**
 * Event Repeat Settings
 * @return {Function} Repeat settings constructor function
 */
Event_Calendar.Repeat_Settings = (function(){
  "use strict";

  var container,
      controller,
      model,
      rsChoice,
      rsContainer,
      variableContentContainer,
      pb,
      smScreenBreakPoint = 550,
      closeBtn,
      cancelBtn,
      okBtn,
      freqInput,
      intervalInput,
      intervalTimeUnit,
      dtstartInput,
      monthDayDropDown,
      monthDayOccurrenceNumberDropDown,
      yearDayDropDown,
      yearDayOccurrenceNumberDropDown,
      endNeverRadio,
      endAfterRadio,
      endUntilRadio,
      countInput,
      untilInput;

  /**
   * Constructor
   * @param {Object} evt An object containing event properties
   */
  function Repeat_Settings(containerSelector, cont, md) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = cont;
    model = md;
  }

  /**
   * Utilities
   */
  
  function supportsTransitions() {
    return Modernizr.csstransitions;
  }


  /**
   *  Modal stuff
   */
   function addAppropriateModalClass() {
     var modal = container,
         windowClass = "modal-window",
         slidedownClass = "modal-slidedown",
         viewportWidth = document.documentElement.clientWidth;
     if( viewportWidth > smScreenBreakPoint ) {
       modal.removeClass(slidedownClass).addClass(windowClass);
     } else {
       modal.removeClass(windowClass).addClass(slidedownClass);
     }
   }

   function toggleModal(evt) {
     var modal = container,
         showClass = "show";

     if(modal.hasClass( showClass ) ) {
       modal.removeClass( showClass );
     }
     else {
       modal.addClass( showClass );
     }
   }

  /**
   * Initialization
   */

  function initInputRefs() {
    closeBtn = $( ".close", container);
    cancelBtn = $( ".cancel", container);
    okBtn = $( ".ok", container);
    freqInput = $(".freq", container);
    intervalInput = $(".interval", container);
    intervalTimeUnit = $(".intervalTimeUnit", container);
    dtstartInput = $(".dtstart", container);
    endNeverRadio = $(".never-rb", container);
    endAfterRadio = $(".count-rb", container);
    endUntilRadio = $(".until-rb", container);
    countInput = $(".count", container);
    untilInput = $(".until", container);
  }

  function initUntil() {
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      untilInput.attr("type", "text").kendoDatePicker({
        parseFormats: ["yyyy-MM-dd"],
        format: "MM/dd/yyyy",
        min: new Date("01/01/1970")
      });
    }
  }
  
  function initInputs() {
    dtstartInput.attr("disabled", true);
    initUntil();
  }

  function initEvents() {
    // Add appropriate modal class when resize ends
    $(window).off("resize").on("resize", _.debounce(function(){
      addAppropriateModalClass();
    }, 500));
    closeBtn.off().on("click", toggleModal);
    cancelBtn.off().on("click", toggleModal);
    okBtn.off().on("click", save);
    freqInput.off().on("change", freqChange);
  }


  /**
   * Events
   */
  
  function freqChange(evt) {
    var freq = freqInput.val();
    var ret = model.setProperty("freq", freq);
    if(ret instanceof Error) {
      // weird edge case error handling?
    }
    else {
      model.setProperty("interval", 1);
      model.removeProperty(_.without(Event_Calendar.Cfg.REPEAT_PROPERTIES, "freq", "interval"));
      setValues(model.getEvent());
    }
  }

  function save(evt) {
    model.setRepeatProperties(getValues());
    console.log("AFTER SET: model.getEvent(): ", model.getEvent());
  }

  /**
   *  Get Values
   */
  
  function getEndTypeValue(values) {
    if(endAfterRadio.prop("checked")) {
      var cnt = countInput.val();
      if(cnt) {
        values.count = cnt;
      }
    }
    else if(endUntilRadio.prop("checked")) {
      var until,
          kendo = untilInput.data("kendoDatePicker");
      until = kendo ? kendo.value() : untilInput[0].value;
      if( until ) {
        values.until = until;
      }
    }
  }

  function getWeeklyValues(values) {
    var byday = pb.getSelectedData();
    if(byday.length > 0) {
      values.byday = byday;
    }
  }

  function getMonthlyValues(values) {
    var type = monthDayOccurrenceNumberDropDown.val();
    if(type == "day") {
      var bymonthday = pb.getSelectedData();
      if(bymonthday.length > 0) {
        values.bymonthday = bymonthday;
      }
    }
    else {
      getDayOccurrenceValue(values);
    }
  }

  function getYearlyValues(values) {
    getDayOccurrenceValue(values);
    var bymonth = pb.getSelectedData().map(function(n){ return parseInt(n, 10); });
    if(bymonth.length > 0) {
      values.bymonth = bymonth;
    }
  }

  function getDayOccurrenceValue(values) {
    var num = values.freq == "monthly" ? monthDayOccurrenceNumberDropDown.val()
                                       : yearDayOccurrenceNumberDropDown.val();
    if(!num) { return; }
    num = parseInt(num, 10);
    var byday = freq == "monthly" ? monthDayDropDown.val()
                                  : yearDayDropDown.val();
    values.byday = byday;
    if (values.byday == "weekday") {
      values.bysetpos = num;
      values.byday = ["mo", "tu", "we", "th", "fr"];
    }
    else if (values.byday == "weekendday") {
      values.bysetpos = num;
      values.byday = ["sa", "su"];
    }
    else if(values.byday == "day") {
      values.bysetpos = num;
      values.byday = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    }
    else if(["su", "mo", "tu", "we", "th", "fr", "sa"].indexOf(values.byday) > -1) {
      values.byday = num + values.byday; // converts to string
    }
  }

  function getValues() {
    var values = {
      freq : freqInput.val(),
      interval : intervalInput.val() || 1,
    };
    switch(values.freq) {
      case "weekly" :
        getWeeklyValues(values);
        break;
      case "monthly" :
        getMonthlyValues(values);
        break;
      case "yearly" :
        getYearlyValues(values);
        break;
      default :
    }
    getEndTypeValue(values);

    return values;
  }

  /**
   * Set Values
   */
  
  function setValues(values) {
    console.log("values: ", values);
    setPersistentValues(values);
    setVariableValues(values);
  }

  function setPersistentValues(values) {
    setFreq(values.freq);
    setInterval(values.freq, values.interval);
    setDtstart(values.dtstart);
    if(values.count) {
      setEndType("count", values.count);
    } else if("until", values.until) {
      setEndType(until);
    } else {
      setEndType("never");
    }
  }

  function setVariableValues(values) {
    if(values.freq == "daily") {
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
    freqInput.val(freq);
  }

  function setDtstart(dtstart) {
    var val = moment(dtstart).format(Event_Calendar.Cfg.MOMENT_DATE_DISPLAY_FORMAT);
    dtstartInput.val(val);
  }

  function setMonthly(values) {
    monthDayDropDown = $(".monthDayDropDown", container);
    monthDayOccurrenceNumberDropDown = $("monthDayOccurrenceNumber", container);

    // Numeric month day
    if(!values.bysetpos && !values.byday) {
      pb.set(values.bymonthday || [new Date(values.dtstart).getDate()]);
    }
    if(values.bymonthday) {
      pb.set(values.bymonthday);
    }
    // special case of a day occurrence e.g first weekendday
    else if(values.bysetpos && values.byday) {
      if(values.byday.length == 2) {
        monthDayDropDown.val("weekendday");
      } else if (values.byday.length == 5) {
        monthDayDropDown.val("weekday");
      } else {
        monthDayDropDown.val("day");
      }
      monthDayOccurrenceNumberDropDown.val(values.bysetpos);
    }
    // month day occurrence e.g. first sunday
    else if(values.byday) {
      var match, regex = /^(-?[1-4]?)([a-z]+)/;
      match = values.byday.match(regex); // "1su" means month day occurrence
      var num = match[1];
      if(num >= -1 && num <= 4) {
        monthDayOccurrenceNumberDropDown.val(num);
      }
      monthDayDropDown.val(match[2]);
    }
  }

  function setYearly(values) {
    var match, regex = /^(-?[1-4]?)([a-z]+)/;
    yearDayDropDown = $(".yearDayDropDown", container);
    yearDayOccurrenceNumberDropDown = $(".yearDayOccurrenceNumber", container);
    
    pb.set(values.bymonth || [new Date(values.dtstart).getMonth() + 1]);
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
    }
    else if(values.byday) {
      match = values.byday.match(regex); // "1su" means year day occurrence
      var num = match[1];
      if(num >= -1 && num <= 4) {
        yearDayOccurrenceNumberDropDown.val(num);
      }
      yearDayDropDown.val(match[2]);
    }
    else {
      yearDayOccurrenceNumberDropDown.val("");
      yearDayDropDown.val("su");
    }
  }

  function setEndType(endType, value) {
    if(!endType || endType == "never") {
      endNeverRadio.prop("checked", true);
    } else if(endType == "count") {
      endAfterRadio.prop("checked", true);
    } else if(endType == "until") {
      endUntilRadio.prop("checked");
    }
  }

  function setInterval(freq, interval) {
    intervalInput.val(interval);
    var timeUnit = "";
    if(freq == "daily") {
      timeUnit = " day(s)";
    } else if(freq == "weekly") {
      timeUnit = " week(s)";
    } else if (freq == "monthly") {
      timeUnit = " month(s)";
    } else if (freq == "yearly") {
      timeUnit = " year(s)";
    }
    intervalTimeUnit.text(timeUnit);
  }



  /**
   *  Render
   */
  
  function renderVariableContent (freq, monthlyDayOfWeek) {
    freq = freq || "";
    if(freq == "daily") {
      variableContentContainer.html("");
    }
    else if(freq == "weekly") {
      variableContentContainer.html(Event_Calendar.Templates.weekly_freq_day_of_week);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 7,
        buttonWidth: 25,
        buttonHeight: 25,
        data: [{text: "SU", value: "su"},{text: "MO", value: "mo"},{text: "TU", value: "tu"},{text: "WE", value: "we"},{text: "TH", value: "th"},{text: "FR", value: "fr"},{text: "SA", value: "sa"}]
      });
    }
    else if(freq == "monthly") {
      if(monthlyDayOfWeek) {
        variableContentContainer.html(Event_Calendar.Templates.monthly_freq_day_of_week);
      }
      else {
        variableContentContainer.html(Event_Calendar.Templates.monthly_freq_numeric_day);
        pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
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
      }
    }
    else if(freq == "yearly") {
      variableContentContainer.html(Event_Calendar.Templates.yearly_freq_month_selection);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
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
    }
    else {
      variableContentContainer.html("");
    }
  }

  /**
   * API 
   */
  Repeat_Settings.prototype = {

    render : function render() {
      container.html(Event_Calendar.Templates.persistent_repeat_inputs);
      variableContentContainer = $(".variable-content-row", container);
      addAppropriateModalClass();
      initInputRefs();
      initInputs();
      setValues(model.getEvent());
      initEvents();
    },

    toggleRepeatSettings : function toggleRepeatSettings(evt) {
      toggleModal(evt);
    }
  };

  return Repeat_Settings;

})();

/**
 * Push Buttons
 */
Event_Calendar.PushButtons = (function(){
  "use strict";

  var container,
      controller,
      buttonElement = "td:not(.filler)",
      selectedData = [];


  function PushButtons(containerSelector, cnt){
    container = $(containerSelector);
    if(container.length === 0) {
      console.error("PushButtons(): Unable to locate container.");
    }
    controller = cnt;
    registerEvents();
  }

  function registerEvents () { 
    container.off("click", buttonElement).on("click", buttonElement, buttonClicked);
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
    getSelectedData : getSelectedData
  };

  PushButtons.prototype = api;

  return PushButtons;

})();
