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
  }

};
