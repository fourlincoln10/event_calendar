/**
 * Event Basic Inputs
 * @return {Function} Model contructor function
 */

Event_Calendar.Basic_Inputs = (function(){
  "use strict";

  var allDayInput,
      cfg,
      container,
      controller,
      descriptionInput,
      dtendDateInput,
      dtendTimeInput,
      dtstartDateInput,
      dtstartTimeInput,
      locationInput,
      model,
      rootContainer,
      repeatEnabledInput,
      summaryInput;

  // -----------------------------------------------
  // 
  //  Constructor
  //  
  // -----------------------------------------------
  
  function Basic_Inputs(cnt, ctrl, md, rootCnt, values) {
    container = cnt;
    cfg = Event_Calendar.Cfg;
    controller = ctrl;
    model = md;
    rootContainer = rootCnt;
    if(values) {
      setValues(values);
    }
  }

  // -----------------------------------------------
  // 
  //  Initialization
  //  
  // -----------------------------------------------
  
  function initInputReferences() {
    summaryInput = $("input.summary", container);
    dtstartDateInput = $("input.dtstart-date", container);
    dtendDateInput = $("input.dtend-date", container);
    dtstartTimeInput = $("input.dtstart-time", container);
    dtendTimeInput = $("input.dtend-time", container);
    allDayInput = $("input.allday", container);
    repeatEnabledInput = $("input.repeatEnabled", container);
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
          min: new Date("01/01/1970"),
          change: setModelValue
        });
      }
    });
    // Time fields
    [dtstartTimeInput, dtendTimeInput].forEach(function(input){
      if(!Modernizr.touch || !Modernizr.inputtypes.date) {
        $(input).attr("type", "text").kendoTimePicker({
          change: setModelValue
        });
      }
    });
  }

  function initEvents() {
    container.off();
    container.on("change", "input:not(.allday,.repeat,.k-input),textarea", setModelValue);
    container.on("change", ".allday", allDayChange);
    container.on("change", ".repeatEnabled", repeatEnabledChange);
    container.on("click", ".save-button", save);
    rootContainer.on("model.change", modelChangeHandler);
    rootContainer.on("repeatSettingsModalClosed", repeatSettingsModalClosed);
  }

  // -----------------------------------------------
  // 
  //  Events
  //  
  // -----------------------------------------------

  function setModelValue(evt) {
    var tgt = $(evt.target || evt.sender.element), kendo, val;
    console.log("setModelValue() tgt: ", tgt);
    if (tgt.is(".summary")) {
      model.set("summary", tgt.val());
    } else if(tgt.is(".dtstart-date,.dtstart-time")) {
      setDtstartInModel();
    } else if(tgt.is(".dtend-date,.dtend-time")) {
      setDtendInModel();
      //model.set("dtend", tgt.val());
    } else if (tgt.is(".location")){
      model.set("location", tgt.val());
    } else if (tgt.is(".description")){
      model.set("description", tgt.val());
    }
    console.log("setModelValue()...new model val: ", model.getEvent());
  }

  function setDtstartInModel() {
    var dtstart = getDtstart();
    var dtend = getDtend();
    var format = isAllDay() ? cfg.MOMENT_DATE_FORMAT : cfg.MOMENT_DATE_TIME_FORMAT;
    // obj so dtstart and dtend can be set together if necessary. Otherwise
    // if dtend needs to be updated but dtstart is set first the event won't
    // pass validation when dtstart is set.
    var upd = {dtstart: dtstart}; 
    if(dtstart && dtend) {
      if(moment(dtend).isBefore(moment(dtstart))) {
        var newDate = isAllDay() ? moment(dtstart) : moment(dtstart).add(1, "hour");
        upd.dtend = newDate.format(format);
      }
    }
    model.set(upd);
  }

  function setDtendInModel() {
    model.set("dtend", getDtend());
  }

  function allDayChange() {
    if(allDayInput.is(":checked")) {
      $(".dtstart-time").hide(); // have to use jquery selector because of kendo
      $(".dtend-time").hide();
    } else {
      $(".dtstart-time").show();
      $(".dtend-time").show();
    }
    //model.toggleAllDay(allDayInput.is(":checked"));
  }

  function repeatEnabledChange(evt) {
    repeatEnabledInput.trigger("repeatEnabledToggled");
  }

  function modelChangeHandler(evt, prop, val) {
    setProperty(prop, val);
  }

  function repeatSettingsModalClosed(evt, repeatSettingsPresent) {
    repeatEnabledInput.prop("checked", repeatSettingsPresent);
  }

  // -----------------------------------------------
  // 
  //  Get data
  //  
  // -----------------------------------------------
  
  function getSummary() {
    return summaryInput.val();
  }

  function getDtstart() {
    var dt = getDtstartDate();
    var time = getDtstartTime();
    var format = isAllDay() ? cfg.MOMENT_DATE_FORMAT : cfg.MOMENT_DATE_TIME_FORMAT;
    return (dt && time) ? moment(dt + "T" + time).format(format) : "";
  }

  function getDtstartDate() {
    return getDateInputVal(dtstartDateInput);
  }

  function getDtstartTime() {
    return getTimeInputVal(dtstartTimeInput);
  }

  function getDtend() {
    var dt = getDtendDate();
    var time = getDtendTime();
    var format = isAllDay() ? cfg.MOMENT_DATE_FORMAT : cfg.MOMENT_DATE_TIME_FORMAT;
    return (dt && time) ? moment(dt + "T" + time).format(format) : "";
  }

  function getDtendDate() {
    return getDateInputVal(dtendDateInput);
  }

  function getDtendTime() {
    return getTimeInputVal(dtendTimeInput);
  }

  function getLocation() {
    return locationInput.val();
  }

  function getDescription() {
    return descriptionInput.val();
  }

  function getValues() {
    return {
      summary : getSummary(),
      dtstart : getDtstart(),
      dtend : getDtend(),
      location : getLocation(),
      description: getDescription()
    };
  }

  function getTimeInputVal(input) {
    var kendo = input.data("kendoTimePicker");
    var val = kendo ? kendo.value() : input[0].value;
    return val ? moment(val).format(cfg.MOMENT_24_HR_TIME_FORMAT) : "";
  }

  function getDateInputVal(input) {
    var kendo = input.data("kendoDatePicker"), val;
    val = kendo ? kendo.value() : input[0].value;
    return val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
  }


  // -----------------------------------------------
  // 
  //  Set data
  //  
  // -----------------------------------------------
  
  function setProperty(prop, val) {
    if(prop == "summary") {
      setSummary(val);
    } else if(prop == "dtstart") {
      setDtstartDate(val);
      setDtstartTime(val);
    } else if(prop == "dtend") {
      setDtendDate(val);
      setDtendTime(val);
    } else if (prop == "location") {
      setLocation(val);
    } else if (prop == "description") {
      setDescription(val);
    }
  }

  function setSummary(summary) {
    summaryInput.val(summary || "");
  }

  function setDtstart(dtstart) {
    setDtstartDate(dtstart);
    setDtstartTime(dtstart);
  }

  function setDtstartDate(dtstart) {
    setDateField(dtstartDateInput, dtstart);
  }

  function setDtstartTime(dtstart) {
    setTimeField(dtstartTimeInput, dtstart);
  }

  function setDtend(dtend) {
    setDtendDate(dtend);
    setDtendTime(dtend);
  }

  function setDtendDate(dtend) {
    setDateField(dtendDateInput, dtend);
  }

  function setDtendTime(dtend) {
    setTimeField(dtendTimeInput, dtend);
  }
  
  function setLocation(loc) {
    locationInput.val(loc || "");
  }

  function setDescription(desc) {
    descriptionInput.val(desc || "");
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

  function setDateField(input, val) {
    var kendo = input.data("kendoDatePicker");
    val = val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
    if(kendo) {
      kendo.value(val);
    } else {
      untilInput[0].value = val;
    }
  }

  function setTimeField(input, value) {
    var kendoTimePicker = input.data("kendoTimePicker");
    if(kendoTimePicker) {
      value =  value ? moment(value).format(Event_Calendar.Cfg.MOMENT_12_HR_TIME_FORMAT) : "";
      kendoTimePicker.value(value);
    }
    else {
      value = value ? moment(value).format(Event_Calendar.Cfg.MOMENT_24_HR_TIME_FORMAT) : "";
      input[0].value = value;
    }
  }

  // -----------------------------------------------
  // 
  //  Misc
  //  
  // -----------------------------------------------

  function isAllDay() {
    return allDayInput.is(":checked");
  }

  // -----------------------------------------------
  // 
  //  Render
  //  
  // -----------------------------------------------

  function render() {
    container.html(Event_Calendar.Templates.basic_inputs);
    initInputReferences();
    initInputs();
    setValues(model.getEvent());
    initEvents();
  }

  function save() {
    console.log("save(): ", getValues());
  }

  /**
   * API 
   */
  Basic_Inputs.prototype = {

    render : render
    
  };

  return Basic_Inputs;

})();
