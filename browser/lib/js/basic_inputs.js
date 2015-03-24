/**
 * Event Basic Inputs
 * @return {Function} Model contructor function
 */
Event_Calendar.Basic_Inputs = (function(){
  "use strict";

  var controller,
      container,
      summaryInput,
      dtstartDateInput,
      dtstartTimeInput,
      dtendDateInput,
      dtendTimeInput,
      allDayInput,
      repeatInput,
      locationInput,
      descriptionInput;

  /**
   * Basic Inputs Constructor
   * @param {Object} evt An object containing event properties
   */
  function Basic_Inputs(containerSelector, contr) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = contr;
  }

  /**
   * Private Functions
   */
  function initInputReferences() {
    summaryInput = $("input.summary", container);
    dtstartDateInput = $("input.dtstart-date", container);
    dtendDateInput = $("input.dtend-date", container);
    dtstartTimeInput = $("input.dtstart-time", container);
    dtendTimeInput = $("input.dtend-time", container);
    allDayInput = $("input.allday", container);
    repeatInput = $("input.repeat", container);
    locationInput = $("input.location", container);
    descriptionInput = $("textarea.description", container);
  }

  // TODO: Account for timezones!
  function calculateInitDates(values) {
    var dtstartDate, dtstartTime, dtendDate, dtendTime;
    // dtstart
    if(values.dtstart) {
      dtstartDate = moment(values.dtstart).format("MM-DD-YYYY");
      dtstartTime = moment(values.dtstart).format("hh:mm A");
    }
    else {
      var coeff = 1000 * 60 * 30;
      dtstartDate = moment().format("MM-DD-YYYY");
      dtstartTime = moment(Math.round(new Date().getTime() / coeff) * coeff).format("hh:mm A"); // rounds to nearest 30mins
    }
    // dtend
    if(values.dtend) {
      dtendDate = moment(values.dtend).format("MM-DD-YYYY");
      dtendTime = moment(values.dtend).format("hh:mm A");
    }
    else {
      dtendDate = dtstartDate;
      var strDt = dtstartDate + " " + dtstartTime;
      var format = "MM-DD-YYYY hh:mm A";
      dtendTime = moment(strDt, format).add(1, "hour").format("hh:mm A");
    }
    return {
      dtstartDate : dtstartDate,
      dtstartTime : dtstartTime,
      dtendDate : dtendDate,
      dtendTime : dtendTime
    };
  }

  function initInputs(values) {
    initInputReferences();
    var dates = calculateInitDates(values);
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      // Date pickers
      var dtOpts = {
        value: new Date(dates.dtstartDate),
        parseFormats: ["MM/dd/yyyy"],
        min: new Date("01/01/1970")
      };
      dtstartDateInput.attr("type", "text").kendoDatePicker(dtOpts);
      dtOpts.value = new Date(dates.dtendDate);
      dtendDateInput.attr("type", "text").kendoDatePicker(dtOpts);
      // Time pickers
      dtstartTimeInput.attr("type", "text").kendoTimePicker({
        value : dates.dtstartTime
      });
      dtendTimeInput.attr("type", "text").kendoTimePicker({
        value : dates.dtendTime
      });
    }
    else {
      dtstartDateInput[0].valueAsDate = dates.dtstartDate;
      dtendDateInput.valueAsDate = dates.dtendDate;
      dtstartTimeInput[0].value = dates.dtstartTime;
      dtendTimeInput[0].value = dates.dtendTime;
    }
  }

  function initEvents() {
    repeatInput.off().on("click", function(evt){controller.toggleRepeatSettings(evt);});
  }

  /**
   * API 
   */
  Basic_Inputs.prototype = {

    /**
     * Render inputs
     */
    render : function render(values) {
      values = values || {};
      container.html(Event_Calendar.Templates.basic_inputs);
      initInputs(values);
      initEvents();
    }
    
    
  };

  return Basic_Inputs;

})();
