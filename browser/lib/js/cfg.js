/**
 * Configuration
 * @type {Object}
 */
Event_Calendar.Cfg = {
  SM_SCREEN_BREAKPOINT        : 550,
  MODAL_WINDOW_CLASS          : "modal-window",
  MODAL_SLIDEDOWN_CLASS       : "modal-slidedown",
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
  WEEKDAYS                    : ["mo", "tu", "we", "th", "fr"],
  WEEKEND_DAYS                : ["sa", "su"],
  DAYS_OF_THE_WEEK            : ["su", "mo", "tu", "we", "th", "fr", "sa"],
  DAY_OCCURRENCE_REGEX        : /^(-?[1-4]?)([a-z]+)/,
  FREQ_ERR_MSG                : "Invalid frequency",
  INTERVAL_ERR_MSG            : "Must be an integer >= 1",
  DTSTART_ERR_MSG             : "Invalid date",
  DTSTART_REQUIRED_ERR_MSG    : "Required",
  DTEND_REQUIRED_ERR_MSG      : "Required",
  END_BEFORE_START_ERR_MSG    : "End date must be after start date",
  DTSTART_TOO_OLD_ERR_MSG     : "Start date too far in past",
  COUNT_ERR_MSG               : "Must be empty or an integer >= 1",
  UNTIL_ERR_MSG               : "Invalid date",
  COUNT_AND_UNTIL_ERR_MSG     : "Can't have both count and until",
  BYDAY_ERR_MSG               : "Invalid byday",
  BYMONTHDAY_ERR_MSG          : "Integer between 1 and 31 (inclusive)",
  BYMONTH_ERR_MSG             : "Integer between 1 and 12 (inclusive)",
  BYSETPOS_ERR_MSG            : "Integer between 1 and 4 (inclusive) or -1",
  MULT_MONTHS_AND_OCC_ERR_MSG : "1 month limit when \"On\" set to multi-day"
};
  