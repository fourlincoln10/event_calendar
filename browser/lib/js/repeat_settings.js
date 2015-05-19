/**
 * Event Repeat Settings
 * @return {Function} Repeat settings constructor function
 */
Event_Calendar.Repeat_Settings = (function(){
  "use strict";

  var activeMonthdayTypeGroup,
      cancelBtn,
      cfg,
      closeBtn,
      container,
      countInput,
      debouncedResize,
      dtstartInput,
      endAfterRadio,
      endNeverRadio,
      endTypeGroup,
      endUntilRadio,
      errorHandler,
      freqInput,
      intervalInput,
      intervalTimeUnit,
      model,
      monthdayNumericActiveRb,
      monthdayOccurrenceActiveRb,
      monthDayOccurrenceNumberDropDown,
      monthdayWeekdayDropdown,
      okBtn,
      pb,
      untilInput,
      validator,
      variableContentContainer,
      yearDayDropDown,
      yearDayOccurrenceNumberDropDown,
      yearWeekdayOccurrenceActiveRb;

  // -----------------------------------------------
  // 
  //  Constructor
  //  
  // -----------------------------------------------

  function Repeat_Settings(containerSelector, md) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Repeat_Settings(): Unable to locate container");
    }
    cfg = Event_Calendar.Cfg;
    model = md;
    validator = Event_Calendar.Validate;
    errorHandler = Event_Calendar.ErrorHandler;
  }


  // -----------------------------------------------
  // 
  //  Initialization
  //  
  // -----------------------------------------------

  function initInputReferences() {
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
        parseFormats: cfg.KENDO_DATE_PARSE_FORMATS,
        format: cfg.KENDO_DATE_DISPLAY_FORMAT,
        min: new Date("01/01/1970"), 
        enabled: false,
        change: validate
      });
    }
  }
  
  function initInputs() {
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
    intervalInput.off().on("change", validate);
    countInput.off().on("change", validate);
  }

  // -----------------------------------------------
  // 
  //  Validate
  //  
  // -----------------------------------------------

  function validate() {
    errorHandler.removeRepeatPropertyErrors();
    var validationErrors = validator.validateRRule(getValues());
    if(validationErrors.length > 0) {
      var err = new Event_Calendar.Errors.ErrorGroup("", validationErrors);
      errorHandler.render(err);
      return false;
    }
    return true;
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
    var values = {
      freq : getFreq(),
      interval : 1,
      dtstart : model.getProperty("dtstart")
    };
    values = _.extend(values, getEndTypeValue());
    setValues(values);
    validate();
  }

  function endTypeChange(evt) {
    var freq = getFreq(), numOcc, unitOfTime, until;
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
    setCount("");
    setUntil("");
    if(endAfterRadio.is(":checked")) {
      disableUntil();
      countInput.prop("disabled", false);
      setCount(numOcc);
    }
    else if(endUntilRadio.is(":checked")) {
      countInput.prop("disabled", true);
      enableUntil();
      until = moment(model.getProperty("dtstart")).format(cfg.MOMENT_DATE_FORMAT);
      setUntil(until);     
    }
    else {
      countInput.prop("disabled", true);
      disableUntil();
    }
    validate();
  }

  function monthlyInputTypeChange(evt) {
    if(monthdayNumericActiveRb.is(":checked")) {
      resetSelectMenu(monthDayOccurrenceNumberDropDown);
      resetSelectMenu(monthdayWeekdayDropdown);
      disableMonthlyOccurrenceMenus();
      pb.set([parseInt(moment(model.getProperty("dtstart")).format("D"))]);
      pb.enable();
      validate();
    }
    else {
      pb.set([]);
      enableMonthlyOccurrenceMenus();
      pb.disable();
      validate();
    }
  }

  function save(evt) {
    if(errorHandler.errorsPresent()) {
      return console.error("Please correct errors before saving.");
    }
    var ret = model.setRepeatProperties(getValues());
    if(ret instanceof Error) {
      errorHandler.render(ret);
    }
    else {
      toggleModal();
    }
    //console.log("REPEAT SETTINGS: ", getValues());
    console.log("MODEL: ", model.getEvent());
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
    if(endAfterRadio.is(":checked")) {
      return {count: getCount()};
    }
    if(endUntilRadio.is(":checked")) {
      return {until: getUntil()};
    }
    return {};
  }

  function getCount() {
    return countInput.val();
  }

  function getUntil() {
    var kendo = untilInput.data("kendoDatePicker");
    var val = kendo ? kendo.value() : untilInput[0].value;
    return val ? moment(val).format(cfg.MOMENT_DATE_TIME_FORMAT) : "";
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
  }

  function getMonthlyValues(values) {
    var ret = {};
    if(monthdayNumericActiveRb.is(":checked")) {
      var bymonthday = pb.getSelectedData();
      var dtstartday = parseInt(moment(model.getProperty("dtstart")).format("D"));
      // multiple days or single day != dtstart day
      if(bymonthday.length > 0 && (bymonthday.length > 1 || bymonthday[0] != dtstartday)) {
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
    // multiple months or single month !== dtstart month
    if(bymonth.length > 0 && (bymonth.length > 1 || bymonth[0] != dtstartmon)) {
      ret.bymonth = bymonth;
    }
    if(yearWeekdayOccurrenceActiveRb.is(":checked")) {
      ret = _.extend(ret, getDayOccurrenceValue());
    }
    return ret;
  }

  function getDayOccurrenceValue() {
    var freq = getFreq();
    var num = freq == "monthly" ? monthDayOccurrenceNumberDropDown.val()
                                : yearDayOccurrenceNumberDropDown.val();
    var byday = null, bysetpos = null, ret = {};
    
    if(!num) { return ret; }
    num = parseInt(num, 10);
    byday = freq == "monthly" ? monthdayWeekdayDropdown.val()
                              : yearDayDropDown.val();
    if (byday == "weekday") {
      bysetpos = num;
      byday = cfg.WEEKDAYS;
    }
    else if (byday == "weekendday") {
      bysetpos = num;
      byday = cfg.WEEKEND_DAYS;
    }
    else if(byday == "day") {
      bysetpos = num;
      byday = cfg.DAYS_OF_THE_WEEK;
    }
    else if(cfg.DAYS_OF_THE_WEEK.indexOf(byday) > -1) {
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
    values = _.extend(values, getEndTypeValue());
    return values;
  }

  // -----------------------------------------------
  // 
  //  Set Values
  //  
  // -----------------------------------------------
  
  function setValues(values) {
    setPersistentValues(values);
    setVariableValues(values);
  }

  function setPersistentValues(values) {
    var freq = values.freq || "daily";
    setFreq(freq);
    setInterval(values.interval || 1);
    setDtstart(values.dtstart);
    if(values.count) {
      setEndType("count", values.count);
    } else if(values.until) {
      setEndType("until", values.until);
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

  function setInterval(interval) {
    intervalInput.val(interval);
    var timeUnit = "";
    var freq = getFreq();
    if(freq == "daily") {
      timeUnit = " " + cfg.DAILY_INTERVAL_TIME_UNIT;
    } else if(freq == "weekly") {
      timeUnit = " " + cfg.WEEKLY_INTERVAL_TIME_UNIT;
    } else if (freq == "monthly") {
      timeUnit = " " + cfg.MONTHLY_INTERVAL_TIME_UNIT;
    } else if (freq == "yearly") {
      timeUnit = " " + cfg.YEARLY_INTERVAL_TIME_UNIT;
    }
    intervalTimeUnit.text(timeUnit);
  }

  function setDtstart(dtstart) {
    var val = moment(dtstart).format(cfg.MOMENT_DATE_DISPLAY_FORMAT);
    dtstartInput.val(val);
  }

  function setNumericMonthday(bymonthday) {
    disableMonthlyOccurrenceMenus();
    monthdayNumericActiveRb.prop("checked", true);
    pb.enable();
    pb.set(bymonthday);
  }

  function setMonthdayOccurrence(occurrenceNumber, day) {
    pb.disable();
    monthdayOccurrenceActiveRb.prop("checked", true);
    enableMonthlyOccurrenceMenus();
    monthDayOccurrenceNumberDropDown.val(occurrenceNumber);
    monthdayWeekdayDropdown.val(day);
  }

  function setMonthly(values) {
    var occurrenceNumber, day;
    // No monthly data present
    if(!values.bymonthday && !values.bysetpos && !values.byday) {
      // use moment instead of date to avoid conversion to local time zone
      setNumericMonthday([parseInt(moment(values.dtstart).format("D"))]);
    }
    // One or more numeric month days
    if(values.bymonthday) {
      setNumericMonthday(values.bymonthday);
    }
    // An instance of a single-day occurrence e.g. "1su" (first sunday)
    if(values.byday && !values.bysetpos) {
      var match = values.byday.match(cfg.DAY_OCCURRENCE_REGEX);
      occurrenceNumber = match[1];
      day = match[2];
      setMonthdayOccurrence(occurrenceNumber, day);
    }
    // Instance of a multi-day occurrence e.g first weekendday
    if(values.byday && values.bysetpos) {
      occurrenceNumber = values.bysetpos;
      if(values.byday.length == cfg.WEEKEND_DAYS.length) {
        day = "weekendday";
      } else if (values.byday.length == cfg.WEEKDAYS.length) {
        day = "weekday";
      } else {
        day = "day";
      }
      setMonthdayOccurrence(occurrenceNumber, day);
    }
  }

  function setYearly(values) {
    pb.set(values.bymonth || [new Date(model.getProperty("dtstart")).getMonth() + 1]);
    // Instance of a multi-day occurrence e.g first weekendday
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
    // An instance of a single-day occurrence e.g. "1su" (first sunday)
    else if(values.byday) {
      var match = values.byday.match(cfg.DAY_OCCURRENCE_REGEX); // "1su" means year day occurrence
      yearDayOccurrenceNumberDropDown.val(match[1]);
      yearDayDropDown.val(match[2]);
    }
    // Month(s) chosen only...reset occurrence menus
    else {
      resetSelectMenu(yearDayOccurrenceNumberDropDown);
      resetSelectMenu(yearDayDropDown);
    }
  }

  function setEndType(endType, value) {
    if(!endType || endType == "never") {
      endNeverRadio.prop("checked", true);
      setCount("");
      setUntil("");
    } else if(endType == "count") {
      endAfterRadio.prop("checked", true);
      setCount(value);
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
    val = val ? moment(val).format(cfg.MOMENT_DATE_FORMAT) : "";
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
  
  function renderWeeklyFreq() {
    variableContentContainer.html(Event_Calendar.Templates.weekly_inputs);
    pb = new Event_Calendar.PushButtons(".pushbutton-container");
    pb.render({
      numCols: 7,
      buttonWidth: 25,
      buttonHeight: 25,
      data: [{text: "SU", value: "su"},{text: "MO", value: "mo"},{text: "TU", value: "tu"},{text: "WE", value: "we"},{text: "TH", value: "th"},{text: "FR", value: "fr"},{text: "SA", value: "sa"}]
    });
    variableContentContainer.off().on("pushButtonSelected pushButtonDeselected", validate);
  }

  function renderMonthlyFreq() {
    variableContentContainer.html(Event_Calendar.Templates.monthly_inputs);
    activeMonthdayTypeGroup = $("input[name=active-monthday-type]");
    activeMonthdayTypeGroup.on("change", monthlyInputTypeChange);
    monthdayNumericActiveRb = $(".monthday-numeric-active", container);
    monthdayOccurrenceActiveRb = $(".monthday-occurrence-active", container);
    monthDayOccurrenceNumberDropDown = $(".monthday-occurrence-number", container);
    monthdayWeekdayDropdown = $(".monthday-weekday-dropdown", container);
    pb = new Event_Calendar.PushButtons(".pushbutton-container");
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
    $(".monthday-occurrence-number, .monthday-weekday-dropdown").off().on("change", validate);
    variableContentContainer.off().on("pushButtonSelected pushButtonDeselected", validate);
  }

  function renderYearlyFreq() {
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
    pb = new Event_Calendar.PushButtons(".pushbutton-container");
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
    $(".yearday-occurrence-number, .yearday-drop-down").off().on("change", validate);
    variableContentContainer.off().on("pushButtonSelected pushButtonDeselected", validate);
  }

  function renderVariableContent (freq, monthlyDayOfWeek) {
    freq = freq || "";
    if(freq == "daily") {
      variableContentContainer.html("");
    } else if(freq == "weekly") {
      renderWeeklyFreq();
    } else if(freq == "monthly") {
      renderMonthlyFreq();
    } else if(freq == "yearly") {
      renderYearlyFreq();
    } else {
      variableContentContainer.html("");
    }
  }

  function render() {
    container.html(Event_Calendar.Templates.persistent_repeat_inputs);
    variableContentContainer = $(".variable-content-row", container);
    addAppropriateModalClass();
    initInputReferences();
    initInputs();
    setValues(model.getEvent());
    initEvents();
  }

  // -----------------------------------------------
  // 
  //  Misc
  //  
  // -----------------------------------------------
  
  function supportsTransitions() {
    return Modernizr.csstransitions;
  }

  function resetSelectMenu(menu) {
    $("option:first-child", menu).attr("selected", "selected");
  }

  function disableMonthlyOccurrenceMenus() {
    monthDayOccurrenceNumberDropDown.prop("disabled", true);
    monthdayWeekdayDropdown.prop("disabled", true);
  }

  function enableMonthlyOccurrenceMenus() {
    monthDayOccurrenceNumberDropDown.prop("disabled", false);
    monthdayWeekdayDropdown.prop("disabled", false);
  }

  // -----------------------------------------------
  // 
  //  Modal stuff
  //  
  // -----------------------------------------------
  function addAppropriateModalClass() {
    var modal = container,
      windowClass = cfg.MODAL_WINDOW_CLASS,
      slidedownClass = cfg.MODAL_SLIDEDOWN_CLASS,
      viewportWidth = document.documentElement.clientWidth;
    if( viewportWidth > cfg.SM_SCREEN_BREAKPOINT ) {
      modal.removeClass(slidedownClass).addClass(windowClass);
    } else {
      modal.removeClass(windowClass).addClass(slidedownClass);
    }
  }

  function toggleModal(evt) {
    var modal = container,
    showClass = cfg.SHOW_MODAL_CLASS;
    if(modal.hasClass( showClass ) ) {
      modal.removeClass( showClass );
    }
    else {
      modal.addClass( showClass );
    }
  }

  
  // -----------------------------------------------
  // 
  //  API
  //  
  // -----------------------------------------------
  Repeat_Settings.prototype = {

    render : render,

    toggleRepeatSettings : toggleRepeatSettings  
  };

  return Repeat_Settings;

})();
