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
  ISO_DATETIME_REGEX          : /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\dZ?$/,
  ISO_DATE_REGEX              : /^\d{4}-[01]\d-[0-3]\d$/,
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
  "edit_inputs": "<div class=\"edit-event-container\"><div class=\"title-row row\"> <label>Title</label> <input type=\"text\" title=\"Event Title\" class=\"summary\" /></div><div class=\"date-row row\"> <label>Start/End</label> <input type=\"text\" title=\"From Date\" class=\"dtstart-date\" /> <input type=\"text\" title=\"From Time\" class=\"dtstart-time\" /> <span class=\"date-sep\">To</span> <input type=\"text\" title=\"To Date\" class=\"dtend-date\" /> <input type=\"text\" title=\"To Time\" class=\"dtend-time\" /></div><div class=\"allday-row row\"> <label>All Day</label> <input type=\"checkbox\" title=\"All Day\" class=\"allday\" /></div><div class=\"repeat-button-row row\"> <label>Repeat</label> <button class=\"repeat-settings-button\" title=\"Repeat Settings\">Repeat</button><div class=\"repeat-msg\"></div></div><div class=\"location-row row\"> <label>Location</label> <input type=\"text\" title=\"Event Location\" class=\"location\" /></div><div class=\"description-row row\"> <label>Title</label><textarea class=\"description\"></textarea></div><div class=\"save-button-row row\"> <button class=\"save-button\" title=\"Save\">Save</button></div></div>",
  "quick_entry_inputs": "<div class=\"dtstart-group\"><h2>Start Date</h2><div class=\"dtstart-inputs\"> <input class=\"ds-date\" title=\"From date\"> <input class=\"ds-time\" title=\"From time\"></div></div><div class=\"dtend-group\"><h2>End Date</h2><div class=\"dtend-inputs\"> <input class=\"de-date\" title=\"End date\"> <input class=\"de-time\" title=\"End time\"></div></div><div class=\"summary-group\"><h2>Summary</h2><div class=\"summary\"><textarea class=\"summary\"></textarea></div></div><div class=\"submit-button\"></div>",
  "repeat_inputs": "<div class='freq-row row'> <label>Repeats:<a class='inlineHelp' data-help='The unit of time used to determine how often the event should repeat e.g. monthly. Defaults to \"never\".'><i class='icon-question-sign'></i></a></label></label> <select class='freq'><option value=''>Never</option><option value='daily'>Daily</option><option value='weekly'>Weekly</option><option value='monthly'>Monthly</option><option value='yearly'>Yearly</option></select><div class='nextOccurrence'></div></div><div class='interval-row row'> <label>Every:<a class='inlineHelp' data-help='This value works with the \"repeats\" unit of time to determine how often the event will repeat e.g. 2 with \"monthly\" means every 2 months. Defaults to 1.'><i class='icon-question-sign'></i></a></label></label> <input type='number' class='interval' min='1'/><span class='intervalTimeUnit'></span></div><div class='weekday-row row'> <label>On:<a class='inlineHelp' data-help='Use this value if the event needs to repeat on one or more days of the week e.g. Monday and Wednesday.'><i class='icon-question-sign'></i></a></label><div class='weekDayContainer'></div></div><div class='monthday-row row'> <label>On:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third fourth or last day of the week that will appear in a drop down menu to the right.'><i class='icon-question-sign'></i></a></label> <select class='monthday-occurrence-number'><option value='day'>Day</option><option value='' disabled='disabled'></option><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select><div class='monthday-container'><div class='pushbutton-container'></div><div class='select-container'> <select class='month-day-dropdown'><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div></div></div><div class='year-month-row row'> <label>In:<a class='inlineHelp' data-help='You can limit the months the event will repeat in by selecting one or more months.'><i class='icon-question-sign'></i></a></label><div class='year-month-container'></div></div><div class='year-day-row row'> <label>On:<a class='inlineHelp' data-help='Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third fourth or last day of the week that will appear in a drop down menu to the right.'><i class='icon-question-sign'></i></a></label> <select class='yearday-occurrence-number'><option value=''></option><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select> <select class='yearday-drop-down'><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div><div class='dtstart-row row'> <label>Starting:<a class='inlineHelp' data-help='The date and time the event goes into effect. You should make this the date and time you want the event to first appear.'><i class='icon-question-sign'></i></a></label> <input type='text' class='dtstart' /></div><div class='end-row row'> <label>Ending:<a class='inlineHelp' data-help='Use this field if the event needs to stop repeating after a certain amount of time. Choose \"After\" if you want to limit the event to a certain number of occurrences. Choose \"Until\" if you want the event to stop repeating on a specific date and time.'><i class='icon-question-sign'></i></a></label> <select class='end'><option value='never'>Never</option><option value='count'>After</option><option value='until'>Until</option></select> <span class='count-wrapper'><input type='number' class='count' min='1'/> occurrence(s)</span> <input type='text' class='until'/></div><hr><div class='button-row row'> <button class='ok'>Ok</button> &nbsp; <button class='cancel'>Cancel</button></div>"
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

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(evt){
    data = {};
    savedState = null;
    if(evt) {
      this.setEvent(evt);
    }
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

    /**
     *  Remove data
     */
    removeProperty : function removeProperty(prop) {
      if(typeof data[prop] !== "undefined") {
        delete data[prop];
        // Can't have an RRule w/o a freq
        if(prop == "freq") {
          data = _.omit(data, Event_Calendar.Cfg.REPEAT_PROPERTIES);
        }
        return publish("updated", this.getEvent());
      }
    }

  };

  return Model;

})();
