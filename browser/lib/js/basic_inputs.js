/**
 * Event Basic Inputs
 * @return {Function} Model contructor function
 */
Event_Calendar.Basic_Inputs = (function(){
  "use strict";

  var allDayInput,
      container,
      controller,
      descriptionInput,
      dtendDateInput,
      dtendTimeInput,
      dtstartDateInput,
      dtstartTimeInput,
      locationInput,
      model,
      repeatInput,
      summaryInput;

  /**
   * Basic Inputs Constructor
   * @param {Object} evt An object containing event properties
   */
  function Basic_Inputs(containerSelector, contr, md) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = contr;
    model = md;
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

  function initInputs(values) {
    // Date fields
    [dtstartDateInput, dtendDateInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoDatePicker({
          parseFormats: cfg.KENDO_DATE_PARSE_FORMATS,
          format: cfg.KENDO_DATE_DISPLAY_FORMAT,
          min: new Date("01/01/1970")
        });
      }
    });
    // Time fields
    [dtstartTimeInput, dtendTimeInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoTimePicker({});
      }
    });
  }

  function initEvents() {
    repeatInput.off().on("click", function(evt){controller.toggleRepeatSettings(evt);});
    summaryInput.off().on("change", summaryChange);
  }

  // -----------------------------------------------
  // 
  //  Events
  //  
  // -----------------------------------------------

  
  
  function summaryChange(evt) {
    var isValid = validator.validateProperty(getSummary());
    if(!isValid) {
      
    }
  }


  // -----------------------------------------------
  // 
  //  Get data
  //  
  // -----------------------------------------------
  
  function getSummary() {
    return summaryInput.val();
  }

  function 

  // -----------------------------------------------
  // 
  //  Set data
  //  
  // -----------------------------------------------

  function setSummary(summary) {
    summaryInput.val(summary);
  }

  function setDateField(input, value) {
    var kendo = input.data("kendoDatePicker");
    val = val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
    if(kendo) {
      kendo.value(val);
    } else {
      untilInput[0].value = val;
    }
  }

  function setDtstartDate(dtstart) {
    setDateField(dtstartDateInput, dtstart);
  }

  function setDtendDate(dtend) {
    setDateField(dtendDateInput, dtend);
  }

  function setTimeField(input, value) {
    var kendoTimePicker = input.data("kendoTimePicker");
    if(kendoTimePicker) {
      value = moment(value).format(Event_Calendar.Cfg.MOMENT_12_HR_TIME_FORMAT);
      kendoTimePicker.value(value);
    }
    else {
      value = moment(value).format(Event_Calendar.Cfg.MOMENT_24_HR_TIME_FORMAT);
      input[0].value = value;
    }
  }
  
  function setDtstartTime(dtstart) {
    setTimeField(dtstartTimeInput, dtstart);
  }

  function setDtendTime(dtend) {
    setTimeField(dtendTimeInput, dtend);
  }

  function setLocation(loc) {
    locationInput.val(loc);
  }

  function setDescription(desc) {
    descriptionInput.val(desc);
  }

  function setValues(values) {
    values = values || {};
    setSummary(values.summary || "");
    setDtstartDate(values.dtstart);
    setDtstartTime(values.dtstart);
    setDtendDate(values.dtend);
    setDtendTime(values.dtend);
    setLocation(values.location || "");
    setDescription(values.description || "");
  }

  /**
   * Render inputs
   */

  function render() {
    container.html(Event_Calendar.Templates.basic_inputs);
    initInputReferences();
    initInputs();
    setValues(model.getEvent());
    initEvents();
  }

  /**
   * API 
   */
  Basic_Inputs.prototype = {

    render : render
    
  };

  return Basic_Inputs;

})();
