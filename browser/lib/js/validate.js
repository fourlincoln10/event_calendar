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
