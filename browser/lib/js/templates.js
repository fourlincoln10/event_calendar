/**
 * Templates
 * @type {Object}  
*/
Event_Calendar.Templates = {
  "basic_inputs": "<div class=\"basic-inputs\"><div class=\"save-button-row row\"> <button class=\"save-button\" title=\"Save\">Save</button></div><div class=\"title-row row\"> <label>Title</label> <input type=\"text\" title=\"Event Title\" class=\"summary\" /></div><div class=\"date-row row\"> <label>Start/End</label> <span class=\"dtstart-group\"><span class=\"dtstart-prefix prefix\">From</span> <input type=\"date\" title=\"From Date\" class=\"dtstart-date\" /> <span class=\"dtstart-separator separator\">at</span> <input type=\"time\" title=\"From Time\" class=\"dtstart-time\" /></span> <span class=\"dtend-group\"><span class=\"dtend-prefix prefix\">To</span> <input type=\"date\" title=\"To Date\" class=\"dtend-date\" /> <span class=\"dtend-separator separator\">at</span> <input type=\"time\" title=\"To Time\" class=\"dtend-time\" /></span></div><div class=\"allday-row row\"> <label>All Day <input type=\"checkbox\" title=\"All Day\" class=\"allday\" /></label></div><div class=\"repeat-row row\"> <label>Repeat <input type=\"checkbox\" title=\"Repeat\" class=\"repeat\" /><span class=\"repeat-msg\"></span></label></div><div class=\"location-row row\"> <label>Location</label> <input type=\"text\" title=\"Event Location\" class=\"location\" /></div><div class=\"description-row row\"> <label>Description</label><textarea class=\"description\"></textarea></div></div>",
  "entry_container": "<div class=\"edit-event-container\"><div class=\"basic-inputs-container\"></div><div class=\"repeat-settings-container\"></div></div>",
  "monthly_freq_day_of_week": "<div class='monthday-row row'> <label>On:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label> <select class='monthday-occurrence-number'><option value='day'>Day</option><option value='' disabled='disabled'></option><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select><div class='monthday-container'><div class='select-container'> <select class='month-day-dropdown'><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div></div></div>",
  "monthly_freq_numeric_day": "<div class='monthday-row row'> <label>On:<a class='inlineHelp' data-help='Select \"Day\" and one of the days of the month if the event needs to repeat on one or more days of the month e.g. the 1st and the 15th. Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third, fourth or last day of the week. A drop down menu will appear to the right so you can choose the day of the week.'><i class='icon-question-sign'></i></a></label> <select class='monthday-occurrence-number'><option value='day'>Day</option><option value='' disabled='disabled'></option><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select><div class='monthday-container'><div class='pushbutton-container'></div></div></div>",
  "persistent_repeat_inputs": "<div class=\"content\"><div><button class=\"close\">&#xd7;</button></div><h3 class=\"title\">Repeat Settings</h3><div class='freq-row row'> <label>Repeats:<a class='inlineHelp' data-help='The unit of time used to determine how often the event should repeat e.g. monthly. Defaults to \"never\".'><i class='icon-question-sign'></i></a></label></label> <select class='freq'><option value='daily'>Daily</option><option value='weekly'>Weekly</option><option value='monthly'>Monthly</option><option value='yearly'>Yearly</option></select><div class='nextOccurrence'></div></div><div class='interval-row row'> <label>Every:<a class='inlineHelp' data-help='This value works with the \"repeats\" unit of time to determine how often the event will repeat e.g. 2 with \"monthly\" means every 2 months. Defaults to 1 if you leave this blank.'><i class='icon-question-sign'></i></a></label></label> <input type='number' class='interval' min='1'/><span class='intervalTimeUnit'></span></div><div class='dtstart-row row'> <label>Starting:<a class='inlineHelp' data-help='The date and time the event starts repeating. You should make this the date and time you want the event to initially appear.'><i class='icon-question-sign'></i></a></label> <input type='text' class='dtstart' /></div><div class='end-row row'> <label>Ending:<a class='inlineHelp' data-help='These buttons allow you to choose when the event should stop repeating. Choose \"After\" if you want to limit the event to a certain number of occurrences. Choose \"Until\" if you want the event to stop repeating on a specific date and time.'><i class='icon-question-sign'></i></a></label><div class=\"end-type\"> <label><input type=\"radio\" class=\"never-rb\" /> Never</label> <label><input type=\"radio\" class=\"count-rb\" /> After <input type=\"number\" class=\"count\" min=\"1\"/> occurrence(s)</label> <label><input type=\"radio\" class=\"until-rb\" /> On <input type=\"text\" class=\"until\"/></label></div></div><div class=\"repeat-settings\"></div><div class='button-row row'> <button class='ok'>Ok</button> &nbsp; <button class='cancel'>Cancel</button></div></div>",
  "quick_entry_inputs": "<div class=\"dtstart-group\"><h2>Start Date</h2><div class=\"dtstart-inputs\"> <input class=\"ds-date\" title=\"From date\"> <input class=\"ds-time\" title=\"From time\"></div></div><div class=\"dtend-group\"><h2>End Date</h2><div class=\"dtend-inputs\"> <input class=\"de-date\" title=\"End date\"> <input class=\"de-time\" title=\"End time\"></div></div><div class=\"summary-group\"><h2>Summary</h2><div class=\"summary\"><textarea class=\"summary\"></textarea></div></div><div class=\"submit-button\"></div>",
  "weekly_freq_day_of_week": "<div class='weekday-row row'> <label>On:<a class='inlineHelp' data-help='Use this value if the event needs to repeat on one or more days of the week e.g. Monday and Wednesday.'><i class='icon-question-sign'></i></a></label><div class='weekDayContainer'></div></div>",
  "yearly_freq_month_selection": "<div class='year-month-row row'> <label>In:<a class='inlineHelp' data-help='You can limit the months the event will repeat in by selecting one or more months.'><i class='icon-question-sign'></i></a></label><div class='year-month-container'></div></div><div class='year-day-row row'> <label>On:<a class='inlineHelp' data-help='Select \"First\", \"Second\", \"Third\", \"Fourth\" or \"Last\" if the event needs to repeat on the first, second, third fourth or last day of the week that will appear in a drop down menu to the right.'><i class='icon-question-sign'></i></a></label> <select class='yearday-occurrence-number'><option value=''></option><option value='1'>First</option><option value='2'>Second</option><option value='3'>Third</option><option value='4'>Fourth</option><option value='-1'>Last</option></select> <select class='yearday-drop-down'><option value='su'>Sunday</option><option value='mo'>Monday</option><option value='tu'>Tuesday</option><option value='we'>Wednesday</option><option value='th'>Thursday</option><option value='fr'>Friday</option><option value='sa'>Saturday</option><option value='' disabled='disabled'></option><option value='day'>Day</option><option value='weekday'>Weekday</option><option value='weekendday'>Weekend Day</option></select></div>"
};
