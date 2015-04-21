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
  function calculateDatesAndTimes(values) {
    var dtstartDate, dtstartTime, dtendDate, dtendTime;
    var dtFormat = "YYYY/MM/DD", tmFormat = "HH:mm";
    // dtstart
    if(values.dtstart) {
      dtstartDate = moment(values.dtstart).format(dtFormat);
      dtstartTime = moment(values.dtstart).format(tmFormat);
    }
    else {
      var coeff = 1000 * 60 * 30; // 1000 ms/sec * 60 sec/min * 30 min/1 = 1800000 ms.
      var rounded = Math.ceil(new Date().getTime() / coeff) * coeff; // Round up to nearest 30 mins and convert to ms
      dtstartDate = moment(rounded).format(dtFormat);
      dtstartTime = moment(rounded).format(tmFormat);
    }
    // dtend
    if(values.dtend) {
      dtendDate = moment(values.dtend).format(dtFormat);
      dtendTime = moment(values.dtend).format(tmFormat);
    }
    else {
      var strDt = dtstartDate + " " + dtstartTime;
      dtendDate = moment(strDt, dtFormat + " " + tmFormat).add(1, "hour").format(dtFormat);
      dtendTime = moment(strDt, dtFormat + " " + tmFormat).add(1, "hour").format(tmFormat);
    }
    return {
      dtstartDate : dtstartDate,
      dtstartTime : dtstartTime,
      dtendDate : dtendDate,
      dtendTime : dtendTime
    };
  }

  function setSummary(values) {
    summaryInput.val(values.summary || "");
  }

  function setDateField(input, value) {
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      var dtPicker = input.data("kendoDatePicker");
      if(dtPicker) {
        dtPicker.value(new Date(value));
      }
      else {
        input.attr("type", "text").kendoDatePicker({
          value: new Date(value),
          parseFormats: ["yyyy-MM-dd"],
          format: "MM/dd/yyyy",
          min: new Date("01/01/1970")
        });
      }
    }
    else {
      input[0].valueAsDate = new Date(value);
    }
  }

  function setDtstartDate(values) {
    if(values.dtstartDate) {
      setDateField(dtstartDateInput, values.dtstartDate);
    }
    else {
      var dt = calculateDatesAndTimes(values);
      setDateField(dtstartDateInput, dt.dtstartDate);
    }
  }

  function setDtendDate(values) {
    if(values.dtendDate) {
      setDateField(dtendDateInput, values.dtendDate);
    }
    else {
      var dt = calculateDatesAndTimes(values);
      setDateField(dtendDateInput, dt.dtendDate);
    }
  }

  function setTimeField(input, value) {
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      var timePicker = input.data("kendoTimePicker");
      if(timePicker) {
        timePicker.value(dtstartTime);
      }
      else {
        input.attr("type", "text").kendoTimePicker({
          value : value
        });
      }
    }
    else {
      input[0].value = value;
    }
  }
  
  function setDtstartTime(values) {
    if(values.dtstartTime) {
      setTimeField(dtstartTimeInput, values.dtstartTime);
    }
    else {
      var dt = calculateDatesAndTimes(values);
      setTimeField(dtstartTimeInput, dt.dtstartTime);
    }
  }

  function setDtendTime(values) {
    if(values.dtendTime) {
      setTimeField(dtendTimeInput, values.dtendTime);
    }
    else {
      var dt = calculateDatesAndTimes(values);
      setTimeField(dtendTimeInput, dt.dtendTime);
    }
  }

  function setLocation(values) {
    locationInput.val(values.location || "");
  }

  function setDescription(values) {
    descriptionInput.val(values.description || "");
  }

  function setValues(values) {
    values = values || {};
    setSummary(values);
    setDtstartDate(values);
    setDtstartTime(values);
    setDtendDate(values);
    setDtendTime(values);
    setLocation(values);
    setDescription(values);
  }

  function initInputs(values) {
    initInputReferences();
    setValues(values);
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
