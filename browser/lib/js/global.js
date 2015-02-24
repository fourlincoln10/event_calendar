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
