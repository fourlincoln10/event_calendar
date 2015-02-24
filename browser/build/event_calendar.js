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
  ISO_DATETIME_REGEX          : /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\dZ?/,
  FREQ_ERR_MSG                : "You must choose never,daily,weekly,monthly or yearly",
  INTERVAL_ERR_MSG            : "Must be empty or an integer >= 1",
  DTSTART_ERR_MSG             : "Please enter a valid date: mm/dd/yyyy hh:mm AM|PM",
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

  validateIsoDateTimeString : function validateIsoDateTimeString(d) {
    return typeof d == "string" && (d.search(Event_Calendar.Cfg.ISO_DATETIME_REGEX) > -1) && moment(d).isValid();
  },

  validateRepeatType : function validateRepeatType(rt) {
    return typeof rt == "string" && (rt === "simple" || rt === "custom");
  },

  validateDtstart : function validateDtstart(dtstart) {
    return this.validateIsoDateTimeString(dtstart);
  },

  validateDtend : function validateDtend(dtend) {
    return this.validateIsoDateTimeString(dtend);
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
    return this.validateIsoDateTimeString(until);
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
    var rrule = _.pick(e, Event_Calendar.Cfg.REPEAT_PROPERTIES);
    var everythingElse =  _.pick(e, _.without(Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW, Event_Calendar.Cfg.REPEAT_PROPERTIES));
    var errors = this.validateRRule(rrule);
    Object.keys(everythingElse).forEach(function(prop){
      if(!ctx.validateProperty(prop, e[prop])) {
        var reason = typeof Event_Calendar.Cfg[prop.toUpperCase() + "_ERR_MSG"] !== "undefined" ? Event_Calendar.Cfg[prop.toUpperCase() + "_ERR_MSG"] : "Unknown error";
        errors.push(new Event_Calendar.Errors.InvalidError(reason, prop));
      }
    });
    if(!_.find(errors, function(e){return e.eventProperty == "dtstart";})) {
      if(e.dtstart && +new Date(e.dtstart) < +new Date("01/01/1970")) {
        errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.DTSTART_TOO_OLD_ERR_MSG, "dtstart"));
      }
      if(e.dtstart && e.until && (+new Date(e.dtstart) >= +new Date(e.until)) ) {
        errors.push(new Event_Calendar.Errors.InvalidError(Event_Calendar.Cfg.END_BEFORE_START_ERR_MSG, "until"));
      }
    }
    return errors;
  }

};

/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  var v = Event_Calendar.Validate;

  function Model(data){
    this.data = null;
    this.fieldsManagedByView = Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW;
    if(data) {
      if(v.validateEvent(data)) {
        this.data = data;
      }
      else {
        console.log("Event_Calendar.Model() Invalid data passed to constructor");
      }
    }
  }

  Model.prototype = {

    /**
     * Get data
     */

    getProperty : function getProperty(prop) {
      return this.data[prop];
    },

    getEvent : function getEvent() {
      return _.extend({}, this.data);
    },

    /**
     * Set Data
     */
    setProperty : function setProperty(prop, val) {
      var err;
      if(this.fieldsManagedByView.indexOf(prop) === -1) {
        err = new Event_Calendar.Errors.UnknownPropertyError("Unknown property", prop);
        amplify.publish("ceModelError", err);
        return err;
      }
      else if(!v.validateProperty(prop, val)) {
        err = new Event_Calendar.Errors.InvalidError("Invalid " + prop, prop);
        return amplify.publish("ceModelError", err);
      }
      // Validate event as a whole so errors involving multiple properties are caught.
      var e = this.getEvent();
      e[prop] = val;
      var validationErrors = v.validateEvent(e);
      if(validationErrors.length > 0) {
        err = new Event_Calendar.Errors.ErrorGroup(validationErrors);
        return amplify.publish("ceModelError", err);
      }
      this.data[prop] = val;
      amplify.publish("ceModelUpdated", e);
    },

    setEvent : function setFieldsEditableByView(fields) {
      amplify.publish("ceModelSetFieldsEditableByView");
      if(!fields) return;
      fields = _.pick(fields, Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW);
      var temp = _.extend({}, this.data, fields);
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length === 0) {
        this.data = temp;
        return amplify.publish("ceModelUpdated", this.getEvent());
      }
      var err = new Event_Calendar.Errors.ErrorGroup(validationErrors);
      amplify.publish("ceModelError", err);
      return err;
    },

    /**
     *  Remove data
     */
    removeProperty : function removeProperty(prop) {
      if(typeof this.data[prop] !== "undefined") {
        delete this.data[prop];
        amplify.publish("ceModelUpdated", this.getEvent());
      }
    }

  };

  return Model;

})();
