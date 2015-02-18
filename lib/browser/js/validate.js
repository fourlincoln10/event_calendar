if (typeof Event_Calendar === 'undefined') {
  if (typeof exports === 'object') {
    // CommonJS
    Event_Calendar = exports;
  } else if (typeof window !== 'undefined') {
    // Browser globals
    this.Event_Calendar = {};
  } else {
    // ...?
    Event_Calendar = {};
  }
}

Event_Calendar.Validate = (function() {
  'use strict';

  var cfg = {
    FREQ_VALUES                 : ["daily", "weekly", "monthly", "yearly"],
    BY_DAY_VALUES               : ["su", "mo", "tu", "we", "th", "fr", "sa", "day", "weekday", "weekendday"],
    BYDAY_REGEX                 : /^(-?[1-4]?)(su|mo|tu|we|th|fr|sa)$/, // /^(-?[1-4]?)([a-z]+)/
    BY_MONTH_VALUES             : ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"],
    FIELDS_MANAGED_BY_VIEW      : ["freq","interval","dtstart","byDay","byMonthDay","byMonth","bySetPos","count","until"],
    UID_REGEX                   : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    UNTIL_FORMAT_STR            : "YYYY-MM-DDTHH:mm:ss.SSSZ",
  };

  /**
   *   Validation
   */
  
  var api = {

    validateProperty: function validateProperty(prop, val) {
      if(prop == 'freq') {
        return this.validateFreq(val);
      } else if (prop == 'repeatType') {
        return this.validateRepeatType(val);
      } else if (prop == 'interval') {
        return this.validateInterval(val);
      } else if (prop == 'uid') {
        return this.validateUid(val);
      } else if (prop == 'dtstart') {
        return this.validateDtStart(val);
      } else if (prop == 'byDay') {
        return this.validateByDay(val);
      } else if (prop == 'byMonth') {
        return this.validateByMonth(val);
      } else if (prop == 'byMonthDay') {
        return this.validateByMonthDay(val);
      } else if(prop == 'bySetPos') {
        return this.validateBySetPos(val);
      } else if (prop == 'count') {
        return this.validateCount(val);
      } else if (prop == 'until') {
        return this.validateUntil(val);
      } else if(prop == 'rrule') {
        return this.validateRRule(val);
      }
      return false;
    },

    validateUid : function validateUid(uid) {
      var regex = cfg.UID_REGEX;
      return typeof uid !== 'undefined' && uid.search(regex) > -1;
    },

    validateRepeatType : function validateRepeatType(rt) {
      return typeof rt == 'string' && (rt === 'simple' || rt === 'custom');
    },

    validateFreq : function validateFreq(freq) {
      return typeof freq == 'string' && cfg.FREQ_VALUES.indexOf(freq) > -1;
    },

    validateInterval : function validateInterval(interval) {
      return typeof interval !== 'undefined' && isInteger(interval) && interval >= 1;
    },

    validateDtStart : function validateDtStart(dtstart) {
      return typeof dtstart !== 'undefined' && moment(dtstart, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid();
    },

    validateByDay : function validateByDay(byDay) {
      if(typeof byDay == 'undefined') return;
      function validate(day) {
        return day.search(cfg.BYDAY_REGEX) > -1;
      }
      if(Array.isArray(byDay)) {
        return byDay.length > 0 &&
               _.every(byDay, function(day) { return validate(day);});
      }
      return validate(byDay);
    },

    validateByMonthDay : function validateByMonthDay(byMonthDay) {
      return  typeof byMonthDay !== 'undefined' &&
              Array.isArray(byMonthDay) &&
              byMonthDay.length > 0 &&
              _.every(byMonthDay, function(md) {
                return isInteger(md) && (md >= 1 && md <= 31);
              });
    },

    validateByMonth : function validateByMonth(byMonth) {
      return typeof byMonth !== 'undefined' && Array.isArray(byMonth) && byMonth.length > 0 && _.every(byMonth, function(month) {
        return isInteger(month) && typeof month === 'number' && (month >= 1 && month <= 12);
      });
    },

    validateBySetPos : function validateBySetPos(bySetPos) {
      return  typeof bySetPos !== 'undefined' &&
              isInteger(bySetPos) &&
              (bySetPos ===  -1 || (bySetPos >= 1 && bySetPos <= 4));
    },

    validateCount : function validateCount(count) {
      return typeof count !== 'undefined' && isInteger(count) && count > 0;
    },

    validateUntil : function validateUntil(until) {
      return  typeof until !== 'undefined' &&
              moment(until, cfg.UNTIL_FORMAT_STR, true).isValid();
    },

    validateRRule : function validateRRule(rule) {
      return typeof rule == 'string';
    },

    validateRecurrence : function validateRecurrence(r) {
      var errors = [];
      Object.keys(r).forEach(function(prop){
        if(!validateProperty(prop, r[prop])) {
          var reason = typeof cfg[prop.toUpperCase() + "_ERR_MSG"] !== 'undefined' ? cfg[prop.toUpperCase() + "_ERR_MSG"] : 'Unknown reason for error';
          errors.push(createErrObj('invalid', reason, prop));
        }
      });
      if(!_.find(errors, function(e){return e.appliesTo == 'dtstart';})) {
        if(r.dtstart && +new Date(r.dtstart) < +new Date('01/01/1970')) {
          erors.push(createErrObj('dtstartTooOld', cfg.DTSTART_TOO_OLD_ERR_MSG, 'dtstart'));
        }
        if(r.dtstart && r.until && (+new Date(r.dtstart) >= +new Date(r.until)) ) {
          errors.push(createErrObj('endBeforeStart', cfg.END_BEFORE_START_ERR_MSG, 'until'));
        }
      }
      if( r.freq && r.freq == 'yearly' && Array.isArray(r.byMonth) && r.byMonth.length > 1 && Array.isArray(r.byDay) && r.byDay.length > 1) {
        errors.push(createErrObj('multMonthsAndOcc', cfg.MULT_MONTHS_AND_OCC_ERR_MSG, 'byMonth'));
      }
      return errors;
    }

  };

})();