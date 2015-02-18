if (typeof Event_Calendar === "undefined") {
  if (typeof exports === "object") {
    // CommonJS
    Event_Calendar = exports;
  } else if (typeof window !== "undefined") {
    // Browser globals
    this.Event_Calendar = {};
  } else {
    // ...?
    Event_Calendar = {};
  }
}

Event_Calendar.Model = (function(opts){
  "use strict";

  var cfg = {
    FREQ_VALUES                 : ["daily", "weekly", "monthly", "yearly"],
    BY_DAY_VALUES               : ["su", "mo", "tu", "we", "th", "fr", "sa", "day", "weekday", "weekendday"],
    BYDAY_REGEX                 : /^(-?[1-4]?)(su|mo|tu|we|th|fr|sa)$/, // /^(-?[1-4]?)([a-z]+)/
    BY_MONTH_VALUES             : ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
    FIELDS_MANAGED_BY_VIEW      : ["freq","interval","dtstart","byDay","byMonthDay","byMonth","bySetPos","count","until"],
    UID_REGEX                   : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    UNTIL_FORMAT_STR            : "YYYY-MM-DDTHH:mm:ss.SSSZ",
    FREQ_ERR_MSG                : "Please choose never,daily,weekly,monthly or yearly",
    INTERVAL_ERR_MSG            : "Must be empty or an integer >= 1",
    DTSTART_ERR_MSG             : "Please enter a valid date: mm/dd/yyyy hh:mm AM|PM",
    END_BEFORE_START_ERR_MSG    : "End date must be after start date",
    DTSTART_TOO_OLD_ERR_MSG     : "Start date too far in past",
    COUNT_ERR_MSG               : "Must be empty or an integer >= 1",
    UNTIL_ERR_MSG               : "Please enter a valid date: mm/dd/yyyy hh:mm AM|PM",
    BYDAY_ERR_MSG               : "Invalid byDay",
    BYMONTHDAY_ERR_MSG          : "Must be an integer between 1 and 31 (inclusive)",
    BYMONTH_ERR_MSG             : "Must be an integer between 1 and 12 (inclusive)",
    BYSETPOS_ERR_MSG            : "Must be between 1 and 4 (inclusive) or -1",
    MULT_MONTHS_AND_OCC_ERR_MSG : "1 month limit when \"On\" set to multi-day"
  };

  function Model(data){
    this.data = null;
    this.freqValues = cfg.FREQ_VALUES;
    this.byDayValues = cfg.BY_DAY_VALUES;
    this.byMonthValues = cfg.BY_MONTH_VALUES;
    this.byDayRegEx = cfg.BYDAY_REGEX;
    this.fieldsManagedByView = cfg.FIELDS_MANAGED_BY_VIEW;
    if(data) {
      if(this.validateRecurrence(data)) {
        this.data = data;
      }
      else {
        console.log("Event_Calendar.Model() Invalid data passed to constructor");
      }
    }
  }

  /**
   * Returns true if i is an integer or a string that can be coerced into an integer
   * @param  {Mixed}  i Value to be checked
   * @return {Boolean} True if i is an integer or can be coerced into one
   */
  function isInteger(i) {
    return typeof i !== "undefined" && !isNaN(parseInt(i, 10)) && Math.floor(i) == i;
  }

  /**
   * Create a standardized error object for the module
   * @param  {String} errType   The type of error e.g. "Invalid"
   * @param  {String} reason    A short description of the error
   * @param  {String} appliesTo The property the error applies to
   * @return {Object} A standard JavaScript object representing an error
   */
  function createErrObj(errType, reason, appliesTo) {
    return {type: errType, reason: reason, appliesTo: appliesTo};
  }

  /**
   * API
   */

  Model.prototype = {

    getProperty : function getProperty(prop) {
      return this.data[prop];
    },

    getRecurrence : function getRecurrence() {
      return JSON.parse(JSON.stringify(this.data));
    },

    getFieldsEditableByView : function getFieldsEditableByView() {
      return _.pick(this.data, this.fieldsManagedByView);
    },

    /**
     * Set Data
     */
    setProperty : function setProperty(prop, val) {
      if(this.fieldsManagedByView.indexOf(prop) === -1) {
        return amplify.publish("recurrenceError", this.createErrObj("unknown", "Unknown property", prop));
      }
      else if(!this.validateProperty(prop, val)) {
        return amplify.publish("recurrenceError", this.createErrObj("invalid", "Invalid " + prop, prop));
      }
      // Validate recurrence as a whole so multiple field errors like 
      // dtstart being required when a freq is specified are caught.
      var r = this.getRecurrence();
      r[prop] = val;
      var validationErrors = this.validateRecurrence(r);
      if(validationErrors.length > 0) {
        return amplify.publish("recurrenceError", validationErrors);
      }
      this.data[prop] = val;
      amplify.publish("recurrenceUpdated", r);
    },

    setFieldsEditableByView : function setFieldsEditableByView(fields) {
      amplify.publish("setFieldsEditableByView");
      if(!fields) return;
      fields = _.pick(fields, this.fieldsManagedByView);
      var temp = _.extend({}, this.data, fields);
      var validationErrors = this.validateRecurrence(temp);
      if(validationErrors.length === 0) {
        if(!fields.dtstart && !fields.freq) {
          this.data = _.pick(temp, "uid");
        }
        else if (fields.dtstart && !fields.freq) {
          this.data = _.pick(temp, "uid", "dtstart");
        }
        else {
          this.data = temp;
        }
        return amplify.publish("recurrenceUpdated", JSON.parse(JSON.stringify(this.data)));
      }
      amplify.publish("recurrenceError", validationErrors);
    },

    /**
     *  Remove data
     */
    removeProperty : function removeProperty(prop) {
      if(typeof this.data[prop] !== "undefined") {
        delete this.data[prop];
        amplify.publish("recurrenceUpdated", JSON.parse(JSON.stringify(this.data)));
      }
    }

  };

  return Model;
})();

