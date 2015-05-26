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
