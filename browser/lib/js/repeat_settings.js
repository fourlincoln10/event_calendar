/**
 * Event Repeat Settings
 * @return {Function} Repeat settings constructor function
 */
Event_Calendar.Repeat_Settings = (function(){
  "use strict";

  var container,
      controller,
      model,
      errorHandler,
      debouncedResize,
      rsChoice,
      rsContainer,
      variableContentContainer,
      pb,
      smScreenBreakPoint = Event_Calendar.Cfg.SM_SCREEN_BREAKPOINT,
      closeBtn,
      cancelBtn,
      okBtn,
      freqInput,
      intervalInput,
      intervalTimeUnit,
      dtstartInput,
      activeMonthdayTypeGroup,
      monthdayNumericActiveRb,
      monthdayOccurrenceActiveRb,
      monthdayWeekdayDropdown,
      monthDayOccurrenceNumberDropDown,
      yearWeekdayOccurrenceActiveRb,
      yearDayDropDown,
      yearDayOccurrenceNumberDropDown,
      endTypeGroup,
      endNeverRadio,
      endAfterRadio,
      endUntilRadio,
      countInput,
      untilInput;

  // -----------------------------------------------
  // 
  //  Constructor
  //  
  // -----------------------------------------------
  // 
  function Repeat_Settings(containerSelector, cont, md) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = cont;
    model = md;
    errorHandler = new Event_Calendar.ErrorHandler(container);
  }

  // -----------------------------------------------
  // 
  //  Utilities
  //  
  // -----------------------------------------------
  
  function supportsTransitions() {
    return Modernizr.csstransitions;
  }

  // -----------------------------------------------
  // 
  //  Error Handling
  //  
  // -----------------------------------------------

  function renderError(err) {
    errorHandler.render(err);
  }

  function testErrorHandling() {
    errorHandler.removeAll();
    Event_Calendar.Cfg.REPEAT_PROPERTIES.forEach(function(prop){
      renderError(new Event_Calendar.Errors.InvalidError(prop + " error", prop));
    });
  }


  // -----------------------------------------------
  // 
  //  Modal stuff
  //  
  // -----------------------------------------------
  function addAppropriateModalClass() {
    var modal = container,
      windowClass = Event_Calendar.Cfg.MODAL_WINDOW_CLASS,
      slidedownClass = Event_Calendar.Cfg.MODAL_SLIDEDOWN_CLASS,
      viewportWidth = document.documentElement.clientWidth;
    if( viewportWidth > smScreenBreakPoint ) {
      modal.removeClass(slidedownClass).addClass(windowClass);
    } else {
      modal.removeClass(windowClass).addClass(slidedownClass);
    }
  }

  function toggleModal(evt) {
    var modal = container,
    showClass = "show";

    if(modal.hasClass( showClass ) ) {
      modal.removeClass( showClass );
    }
    else {
      modal.addClass( showClass );
    }
  }

  // -----------------------------------------------
  // 
  //  Initialization
  //  
  // -----------------------------------------------

  function initInputRefs() {
    closeBtn = $( ".close", container);
    cancelBtn = $( ".cancel", container);
    okBtn = $( ".ok", container);
    freqInput = $(".freq", container);
    intervalInput = $(".interval", container);
    intervalTimeUnit = $(".intervalTimeUnit", container);
    dtstartInput = $(".dtstart", container);
    endTypeGroup = $("input[name=end-type]");
    endNeverRadio = $(".never-rb", container);
    endAfterRadio = $(".count-rb", container);
    endUntilRadio = $(".until-rb", container);
    countInput = $(".count", container);
    untilInput = $(".until", container);
  }

  function initUntil() {
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      untilInput.attr("type", "text").kendoDatePicker({
        parseFormats: Event_Calendar.Cfg.KENDO_DATE_PARSE_FORMATS,
        format: "MM/dd/yyyy",
        min: new Date("01/01/1970"), 
        enabled: false
      });
    }
  }
  
  function initInputs() {
    dtstartInput.attr("disabled", true);
    initUntil();
  }

  function initEvents() {
    if(debouncedResize) { $(window).off("resize", debouncedResize); }
    debouncedResize = _.debounce(addAppropriateModalClass, 500);
    $(window).on("resize", debouncedResize);
    closeBtn.off().on("click", toggleModal);
    cancelBtn.off().on("click", toggleModal);
    okBtn.off().on("click", save);
    endTypeGroup.off().on("change", endTypeChange);
    freqInput.off().on("change", freqChange);
    intervalInput.off().on("change", intervalChange);
    countInput.off("click", countClick).on("click", countClick);
    untilInput.off("click", untilClick).on("click", untilClick);
  }


  // -----------------------------------------------
  // 
  //  Events
  //  
  // -----------------------------------------------
  
  function toggleRepeatSettings(evt) {
    toggleModal(evt);
  }

  function freqChange(evt) {
    var freq = getFreq();
    var ret = model.setProperty("freq", freq);
    if( !(ret instanceof Error) ) {
      model.setProperty("interval", 1);
      var removeProps = _.without(Event_Calendar.Cfg.REPEAT_PROPERTIES, "freq", "interval", "count", "until");
      model.removeProperty(removeProps);
      setValues(model.getEvent());
      //testErrorHandling();  // Comment out when not testing
    }
  }

  function intervalChange(evt) {
    model.setProperty("interval", getInterval());
  }

  function endTypeChange(evt) {
    var freq = freqInput.val(), numOcc, unitOfTime, until, ret;
    if ( freq == "daily" ) {
      numOcc = 5;           // 5 days
      unitOfTime = "days";
    } else if ( freq == "weekly") {
      numOcc = 24;          // 24 weeks aka 6 months
      unitOfTime = "weeks";
    } else if (freq == "monthly") {
      numOcc = 12;          // 12 months
      unitOfTime = "months";
    } else if (freq == "yearly") {
      numOcc = 5;           // 5 years
      unitOfTime = "years";
    }
    model.removeProperty("count");
    model.removeProperty("until");
    setCount("");
    setUntil("");
    if(endAfterRadio.is(":checked")) {
      disableUntil();
      countInput.prop("disabled", false);
      setCount(numOcc);
      model.setProperty("count", numOcc);
    }
    else if(endUntilRadio.is(":checked")) {
      countInput.prop("disabled", true);
      enableUntil();
      var dtstart = moment(model.getProperty("dtstart"));
      until = dtstart.add(numOcc, unitOfTime).format(Event_Calendar.Cfg.MOMENT_DATE_FORMAT);
      setUntil(until);
      model.setProperty("until", until);     
    }
    else {
      countInput.prop("disabled", true);
      disableUntil();
    }
  }

  function countChange(evt) {
    model.removeProperty("until");
    model.setProperty("count", getCount());
  }

  function countClick (evt) {
    endAfterRadio.prop("checked", true);
  }

  function untilClick (evt) {
    endUntilRadio.prop("checked", true);
  }

  function untilChange(evt) {
    model.removeProps("count");
    model.setProperty("until", getUntil());
  }

  function save(evt) {
    var ret = model.setRepeatProperties(getValues());
    console.log("model.getEvent(): ", model.getEvent());
  }


  // -----------------------------------------------
  // 
  //  Get Values
  //  
  // -----------------------------------------------
  
  function getFreq() {
    return freqInput.val();
  }
  
  function getInterval() {
    return intervalInput.val();
  }
  
  function getEndTypeValue() {
    if(endAfterRadio.prop("checked")) {
      return {count: getCount()};
    }
    if(endUntilRadio.prop("checked")) {
      return {until: getUntil()};
    }
    return {};
  }

  function getCount() {
    return countInput.val();
  }

  function getUntil() {
    var val,
        kendo = untilInput.data("kendoDatePicker"),
        dtstart = moment(model.getProperty("dtstart"));
    val = kendo ? kendo.value() : untilInput[0].value;
    return val ? moment(val).hours(dtstart.hours()).minutes(dtstart.minutes()).format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT) : "";
  }

  function getWeeklyValues() {
    // Only need byday if the user selected multiple days or they
    // selected a single day that is not equal to the dtstart day.
    // Otherwise we can rely on the rrule generating occurrences on the dtstart day
    var byday = pb.getSelectedData();
    if(byday.length > 0) {
      var dtstartDay = moment(model.getProperty("dtstart")).format("dd").toLowerCase();
      if(byday.length > 1 || byday.indexOf(dtstartDay) == -1) {
        return byday;
      }
    }
    return null;
  }

  function getMonthlyValues(values) {
    var ret = {};
    if(monthdayNumericActiveRb.is(":checked")) {
      var bymonthday = pb.getSelectedData();
      var dtstartday = parseInt(moment(model.getProperty("dtstart")).format("D"));
      if(bymonthday.length > 1 || bymonthday[0] != dtstartday) {
        ret.bymonthday = bymonthday;
      }
      return ret;
    }
    else if(monthdayOccurrenceActiveRb.is(":checked")) {
      return getDayOccurrenceValue(values);
    }
  }

  function getYearlyValues() {
    var ret = {};
    var bymonth = pb.getSelectedData().map(function(n){ return parseInt(n, 10); });
    var dtstartmon = moment(model.getProperty("dtstart")).format("M");
    if(bymonth.length > 1 || bymonth[0] != dtstartmon) {
      ret.bymonth = bymonth;
    }
    if(yearWeekdayOccurrenceActiveRb.is(":checked")) {
      ret = _.extend(ret, getDayOccurrenceValue());
    }
    return ret;
  }

  function getDayOccurrenceValue() {
    var freq = model.getProperty("freq");
    var num = freq == "monthly" ? monthDayOccurrenceNumberDropDown.val()
                                : yearDayOccurrenceNumberDropDown.val();
    var byday = null, bysetpos = null, ret = {};
    
    if(!num) { return ret; }
    num = parseInt(num, 10);
    byday = freq == "monthly" ? monthdayWeekdayDropdown.val()
                              : yearDayDropDown.val();
    if (byday == "weekday") {
      bysetpos = num;
      byday = Event_Calendar.Cfg.WEEKDAYS;
    }
    else if (byday == "weekendday") {
      bysetpos = num;
      byday = Event_Calendar.Cfg.WEEKEND_DAYS;
    }
    else if(byday == "day") {
      bysetpos = num;
      byday = Event_Calendar.Cfg.DAYS_OF_THE_WEEK;
    }
    else if(Event_Calendar.Cfg.DAYS_OF_THE_WEEK.indexOf(byday) > -1) {
      byday = num + byday; // converts to string
    }
    if(bysetpos) ret.bysetpos = bysetpos;
    if(byday) ret.byday = byday;
    return ret;
  }

  function getValues() {
    var values = {
      freq : getFreq(),
      interval : getInterval()
    };
    switch(values.freq) {
      case "weekly" :
        var byday = getWeeklyValues();
        if ( byday ) values.byday = byday;
        break;
      case "monthly" :
        values = _.extend(values, getMonthlyValues());
        break;
      case "yearly" :
        values = _.extend(values, getYearlyValues());
        break;
      default :
    }
    var end = getEndTypeValue();
    Object.keys(end).forEach(function(key){
      values[key] = end[key];
    });
    return values;
  }

  // -----------------------------------------------
  // 
  //  Set Values
  //  
  // -----------------------------------------------
  
  function setValues(values) {
    console.log("values: ", values);
    setPersistentValues(values);
    setVariableValues(values);
  }

  function setPersistentValues(values) {
    setFreq(values.freq);
    setInterval(values.freq, values.interval);
    setDtstart(values.dtstart);
    if(values.count) {
      setEndType("count", values.count);
    } else if("until", values.until) {
      setEndType("until");
    } else {
      setEndType("never");
    }
  }

  function setVariableValues(values) {
    if(values.freq == "daily") {
      renderVariableContent("daily");
    } else if(values.freq == "weekly") {
      renderVariableContent(values.freq);
      pb.set(values.byday || [moment(values.dtstart).format("dd").toLowerCase()]);
    } else if (values.freq == "monthly") {
      if(!values.bysetpos && !values.byday) {
        renderVariableContent("monthly");
      } else {
        renderVariableContent("monthly", true);
      }
      setMonthly(values);
    } else if (values.freq == "yearly") {
      renderVariableContent("yearly");
      setYearly(values);
    }
  }

  function setFreq(freq) {
    freqInput.val(freq);
  }

  function setInterval(freq, interval) {
    intervalInput.val(interval);
    var timeUnit = "";
    if(freq == "daily") {
      timeUnit = " day(s)";
    } else if(freq == "weekly") {
      timeUnit = " week(s)";
    } else if (freq == "monthly") {
      timeUnit = " month(s)";
    } else if (freq == "yearly") {
      timeUnit = " year(s)";
    }
    intervalTimeUnit.text(timeUnit);
  }

  function setDtstart(dtstart) {
    var val = moment(dtstart).format(Event_Calendar.Cfg.MOMENT_DATE_DISPLAY_FORMAT);
    dtstartInput.val(val);
  }

  function setMonthly(values) {
    // Numeric month day
    if(!values.bysetpos && !values.byday) {
      // use moment instead of date to avoid conversion to local time zone
      pb.set(values.bymonthday || [parseInt(moment(values.dtstart).format("D"))]);
    }
    if(values.bymonthday) {
      pb.set(values.bymonthday);
    }
    // special case of a day occurrence e.g first weekendday
    else if(values.bysetpos && values.byday) {
      if(values.byday.length == 2) {
        monthdayWeekdayDropdown.val("weekendday");
      } else if (values.byday.length == 5) {
        monthdayWeekdayDropdown.val("weekday");
      } else {
        monthDayDropDown.val("day");
      }
      monthDayOccurrenceNumberDropDown.val(values.bysetpos);
    }
    // month day occurrence e.g. first sunday
    else if(values.byday) {
      var match, regex = Event_Calendar.Cfg.DAY_OCCURRENCE_REGEX;
      match = values.byday.match(regex); // "1su" means month day occurrence
      var num = match[1];
      if(num >= -1 && num <= 4) {
        monthDayOccurrenceNumberDropDown.val(num);
      }
      monthDayDropDown.val(match[2]);
    }
  }

  function setYearly(values) {
    var match, regex = Event_Calendar.Cfg.DAY_OCCURRENCE_REGEX;
    pb.set(values.bymonth || [new Date(values.dtstart).getMonth() + 1]);
    if(values.bysetpos && values.byday) {
      if(values.byday.length === 2) {
        yearDayDropDown.val("weekendday");
      }
      else if (values.byday.length === 5) {
        yearDayDropDown.val("weekday");
      }
      else {
        yearDayDropDown.val("day");
      }
      yearDayOccurrenceNumberDropDown.val(values.bysetpos);
    }
    else if(values.byday) {
      match = values.byday.match(regex); // "1su" means year day occurrence
      var num = match[1];
      if(num >= -1 && num <= 4) {
        yearDayOccurrenceNumberDropDown.val(num);
      }
      yearDayDropDown.val(match[2]);
    }
    else {
      yearDayOccurrenceNumberDropDown.prop("defaultSelected");
      yearDayDropDown.prop("defaultSelected");
    }
  }

  function setEndType(endType, value) {
    if(!endType || endType == "never") {
      endNeverRadio.prop("checked", true);
    } else if(endType == "count") {
      endAfterRadio.prop("checked", true);
      countInput.val(value);
    } else if(endType == "until") {
      endUntilRadio.prop("checked");
      setUntil(value);
    }
  }

  function disableUntil() {
    var kendo = untilInput.data("kendoDatePicker");
    if(kendo) {
      kendo.enable(false);
    } else {
      untilInput.prop("disabled", true);
    }
  }

  function enableUntil() {
    var kendo = untilInput.data("kendoDatePicker");
    if(kendo) {
      kendo.enable(true);
    } else {
      untilInput.prop("disabled", false);
    }
  }

  function setUntil(val) {
    var kendo = untilInput.data("kendoDatePicker");
    val = val ? moment(val).format(Event_Calendar.Cfg.MOMENT_DATE_FORMAT) : "";
    if(kendo) {
      kendo.value(val);
    } else {
      untilInput[0].value = val;
    }
  }

  function setCount(val) {
    countInput.val(val);
  }

  // -----------------------------------------------
  // 
  //  Render
  //  
  // -----------------------------------------------
  
  function renderVariableContent (freq, monthlyDayOfWeek) {
    freq = freq || "";
    if(freq == "daily") {
      variableContentContainer.html("");
    }
    else if(freq == "weekly") {
      variableContentContainer.html(Event_Calendar.Templates.weekly_inputs);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 7,
        buttonWidth: 25,
        buttonHeight: 25,
        data: [{text: "SU", value: "su"},{text: "MO", value: "mo"},{text: "TU", value: "tu"},{text: "WE", value: "we"},{text: "TH", value: "th"},{text: "FR", value: "fr"},{text: "SA", value: "sa"}]
      });
    }
    else if(freq == "monthly") {
      variableContentContainer.html(Event_Calendar.Templates.monthly_inputs);
      activeMonthdayTypeGroup = $("input[name=active-monthday-type]");
      activeMonthdayTypeGroup.on("change", function(){
        if(monthdayOccurrenceActiveRb.is(":checked")) {
          $(".monthday-occurrence-number, .monthday-weekday-dropdown").prop("disabled", false);
        } else {
          $(".monthday-occurrence-number, .monthday-weekday-dropdown").prop("disabled", true);
        }
      });
      monthdayNumericActiveRb = $(".monthday-numeric-active", container);
      monthdayOccurrenceActiveRb = $(".monthday-occurrence-active", container);
      monthDayOccurrenceNumberDropDown = $(".monthday-occurrence-number", container);
      monthdayWeekdayDropdown = $(".monthday-weekday-dropdown", container);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 7,
        buttonWidth: 25,
        buttonHeight: 25,
        data: [
          {text: 1, value: 1},{text: 2, value: 2},{text: 3, value: 3},
          {text: 4, value: 4},{text: 5, value: 5},{text: 6, value: 6},
          {text: 7, value: 7},{text: 8, value: 8},{text: 9, value: 9},
          {text: 10, value: 10},{text: 11, value: 11},{text: 12, value: 12},
          {text: 13, value: 13},{text: 14, value: 14},{text: 15, value: 15},
          {text: 16, value: 16},{text: 17, value: 17},{text: 18, value: 18},
          {text: 19, value: 19},{text: 20, value: 20},{text: 21, value: 21},
          {text: 22, value: 22},{text: 23, value: 23},{text: 24, value: 24},
          {text: 25, value: 25},{text: 26, value: 26},{text: 27, value: 27},
          {text: 28, value: 28},{text: 29, value: 29},{text: 30, value: 30},
          {text: 31, value: 31}
        ]
      });
    }
    else if(freq == "yearly") {
      variableContentContainer.html(Event_Calendar.Templates.yearly_inputs);
      yearDayDropDown = $(".yearday-drop-down", container);
      yearDayOccurrenceNumberDropDown = $(".yearday-occurrence-number", container);
      yearWeekdayOccurrenceActiveRb = $(".year-day-occurrence-active", container);
      yearWeekdayOccurrenceActiveRb.on("change", function(){
        if(yearWeekdayOccurrenceActiveRb.is(":checked")) {
          $(".yearday-occurrence-number, .yearday-drop-down").prop("disabled", false);
        } else {
          $(".yearday-occurrence-number, .yearday-drop-down").prop("disabled", true);
        }
      });
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 6,
        buttonWidth: 28,
        buttonHeight: 28,
        data: [
          {text: "Jan", value: 1},{text: "Feb", value: 2},{text: "Mar", value: 3},
          {text: "Apr", value: 4},{text: "May", value: 5},{text: "Jun", value: 6},
          {text: "Jul", value: 7},{text: "Aug", value: 8},{text: "Sep", value: 9},
          {text: "Oct", value: 10},{text: "Nov", value: 11},{text: "Dec", value: 12}
        ]
      });
    }
    else {
      variableContentContainer.html("");
    }
  }

  function render() {
    container.html(Event_Calendar.Templates.persistent_repeat_inputs);
    variableContentContainer = $(".variable-content-row", container);
    addAppropriateModalClass();
    initInputRefs();
    initInputs();
    setValues(model.getEvent());
    initEvents();
  }

  
  // -----------------------------------------------
  // 
  //  API
  //  
  // -----------------------------------------------
  Repeat_Settings.prototype = {

    render : render,

    toggleRepeatSettings : toggleRepeatSettings,

    renderError : renderError
  
  };

  return Repeat_Settings;

})();
