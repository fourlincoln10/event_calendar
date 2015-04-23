/**
 * Event Repeat Settings
 * @return {Function} Repeat settings constructor function
 */
Event_Calendar.Repeat_Settings = (function(){
  "use strict";

  var container,
      controller,
      model,
      rsChoice,
      rsContainer,
      variableContentContainer,
      pb,
      smScreenBreakPoint = 550,
      closeBtn,
      cancelBtn,
      okBtn,
      freqInput,
      intervalInput,
      intervalTimeUnit,
      dtstartInput,
      monthDayDropDown,
      monthDayOccurrenceNumberDropDown,
      yearDayDropDown,
      yearDayOccurrenceNumberDropDown,
      endNeverRadio,
      endAfterRadio,
      endUntilRadio,
      countInput,
      untilInput;

  /**
   * Constructor
   * @param {Object} evt An object containing event properties
   */
  function Repeat_Settings(containerSelector, cont, md) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = cont;
    model = md;
  }

  /**
   * Utilities
   */
  
  function supportsTransitions() {
    return Modernizr.csstransitions;
  }


  /**
   *  Modal stuff
   */
   function addAppropriateModalClass() {
     var modal = container,
         windowClass = "modal-window",
         slidedownClass = "modal-slidedown",
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

  /**
   * Initialization
   */

  function initInputRefs() {
    closeBtn = $( ".close", container);
    cancelBtn = $( ".cancel", container);
    okBtn = $( ".ok", container);
    freqInput = $(".freq", container);
    intervalInput = $(".interval", container);
    intervalTimeUnit = $(".intervalTimeUnit", container);
    dtstartInput = $(".dtstart", container);
    endNeverRadio = $(".never-rb", container);
    endAfterRadio = $(".count-rb", container);
    endUntilRadio = $(".until-rb", container);
    countInput = $(".count", container);
    untilInput = $(".until", container);
  }

  function initUntil() {
    if(!Modernizr.touch || !Modernizr.inputtypes.date) {
      untilInput.attr("type", "text").kendoDatePicker({
        parseFormats: ["yyyy-MM-dd"],
        format: "MM/dd/yyyy",
        min: new Date("01/01/1970")
      });
    }
  }
  
  function initInputs() {
    dtstartInput.attr("disabled", true);
    initUntil();
  }

  function initEvents() {
    // Add appropriate modal class when resize ends
    $(window).off("resize").on("resize", _.debounce(function(){
      addAppropriateModalClass();
    }, 500));
    closeBtn.off().on("click", toggleModal);
    cancelBtn.off().on("click", toggleModal);
    okBtn.off().on("click", save);
    freqInput.off().on("change", freqChange);
  }


  /**
   * Events
   */
  
  function freqChange(evt) {
    var freq = freqInput.val();
    var ret = model.setProperty("freq", freq);
    if(ret instanceof Error) {
      // weird edge case error handling?
    }
    else {
      model.setProperty("interval", 1);
      model.removeProperty(_.without(Event_Calendar.Cfg.REPEAT_PROPERTIES, "freq", "interval"));
      setValues(model.getEvent());
    }
  }

  function save(evt) {
    model.setRepeatProperties(getValues());
    console.log("AFTER SET: model.getEvent(): ", model.getEvent());
  }

  /**
   *  Get Values
   */
  
  function getEndTypeValue(values) {
    if(endAfterRadio.prop("checked")) {
      var cnt = countInput.val();
      if(cnt) {
        values.count = cnt;
      }
    }
    else if(endUntilRadio.prop("checked")) {
      var until,
          kendo = untilInput.data("kendoDatePicker");
      until = kendo ? kendo.value() : untilInput[0].value;
      if( until ) {
        values.until = until;
      }
    }
  }

  function getWeeklyValues(values) {
    var byday = pb.getSelectedData();
    if(byday.length > 0) {
      values.byday = byday;
    }
  }

  function getMonthlyValues(values) {
    var type = monthDayOccurrenceNumberDropDown.val();
    if(type == "day") {
      var bymonthday = pb.getSelectedData();
      if(bymonthday.length > 0) {
        values.bymonthday = bymonthday;
      }
    }
    else {
      getDayOccurrenceValue(values);
    }
  }

  function getYearlyValues(values) {
    getDayOccurrenceValue(values);
    var bymonth = pb.getSelectedData().map(function(n){ return parseInt(n, 10); });
    if(bymonth.length > 0) {
      values.bymonth = bymonth;
    }
  }

  function getDayOccurrenceValue(values) {
    var num = values.freq == "monthly" ? monthDayOccurrenceNumberDropDown.val()
                                       : yearDayOccurrenceNumberDropDown.val();
    if(!num) { return; }
    num = parseInt(num, 10);
    var byday = freq == "monthly" ? monthDayDropDown.val()
                                  : yearDayDropDown.val();
    values.byday = byday;
    if (values.byday == "weekday") {
      values.bysetpos = num;
      values.byday = ["mo", "tu", "we", "th", "fr"];
    }
    else if (values.byday == "weekendday") {
      values.bysetpos = num;
      values.byday = ["sa", "su"];
    }
    else if(values.byday == "day") {
      values.bysetpos = num;
      values.byday = ["su", "mo", "tu", "we", "th", "fr", "sa"];
    }
    else if(["su", "mo", "tu", "we", "th", "fr", "sa"].indexOf(values.byday) > -1) {
      values.byday = num + values.byday; // converts to string
    }
  }

  function getValues() {
    var values = {
      freq : freqInput.val(),
      interval : intervalInput.val() || 1,
    };
    switch(values.freq) {
      case "weekly" :
        getWeeklyValues(values);
        break;
      case "monthly" :
        getMonthlyValues(values);
        break;
      case "yearly" :
        getYearlyValues(values);
        break;
      default :
    }
    getEndTypeValue(values);

    return values;
  }

  /**
   * Set Values
   */
  
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
      setEndType(until);
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

  function setDtstart(dtstart) {
    var val = moment(dtstart).format(Event_Calendar.Cfg.MOMENT_DATE_DISPLAY_FORMAT);
    dtstartInput.val(val);
  }

  function setMonthly(values) {
    monthDayDropDown = $(".monthDayDropDown", container);
    monthDayOccurrenceNumberDropDown = $("monthDayOccurrenceNumber", container);

    // Numeric month day
    if(!values.bysetpos && !values.byday) {
      pb.set(values.bymonthday || [new Date(values.dtstart).getDate()]);
    }
    if(values.bymonthday) {
      pb.set(values.bymonthday);
    }
    // special case of a day occurrence e.g first weekendday
    else if(values.bysetpos && values.byday) {
      if(values.byday.length == 2) {
        monthDayDropDown.val("weekendday");
      } else if (values.byday.length == 5) {
        monthDayDropDown.val("weekday");
      } else {
        monthDayDropDown.val("day");
      }
      monthDayOccurrenceNumberDropDown.val(values.bysetpos);
    }
    // month day occurrence e.g. first sunday
    else if(values.byday) {
      var match, regex = /^(-?[1-4]?)([a-z]+)/;
      match = values.byday.match(regex); // "1su" means month day occurrence
      var num = match[1];
      if(num >= -1 && num <= 4) {
        monthDayOccurrenceNumberDropDown.val(num);
      }
      monthDayDropDown.val(match[2]);
    }
  }

  function setYearly(values) {
    var match, regex = /^(-?[1-4]?)([a-z]+)/;
    yearDayDropDown = $(".yearDayDropDown", container);
    yearDayOccurrenceNumberDropDown = $(".yearDayOccurrenceNumber", container);
    
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
      yearDayOccurrenceNumberDropDown.val("");
      yearDayDropDown.val("su");
    }
  }

  function setEndType(endType, value) {
    if(!endType || endType == "never") {
      endNeverRadio.prop("checked", true);
    } else if(endType == "count") {
      endAfterRadio.prop("checked", true);
    } else if(endType == "until") {
      endUntilRadio.prop("checked");
    }
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



  /**
   *  Render
   */
  
  function renderVariableContent (freq, monthlyDayOfWeek) {
    freq = freq || "";
    if(freq == "daily") {
      variableContentContainer.html("");
    }
    else if(freq == "weekly") {
      variableContentContainer.html(Event_Calendar.Templates.weekly_freq_day_of_week);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 7,
        buttonWidth: 25,
        buttonHeight: 25,
        data: [{text: "SU", value: "su"},{text: "MO", value: "mo"},{text: "TU", value: "tu"},{text: "WE", value: "we"},{text: "TH", value: "th"},{text: "FR", value: "fr"},{text: "SA", value: "sa"}]
      });
    }
    else if(freq == "monthly") {
      if(monthlyDayOfWeek) {
        variableContentContainer.html(Event_Calendar.Templates.monthly_freq_day_of_week);
      }
      else {
        variableContentContainer.html(Event_Calendar.Templates.monthly_freq_numeric_day);
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
    }
    else if(freq == "yearly") {
      variableContentContainer.html(Event_Calendar.Templates.yearly_freq_month_selection);
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

  /**
   * API 
   */
  Repeat_Settings.prototype = {

    render : function render() {
      container.html(Event_Calendar.Templates.persistent_repeat_inputs);
      variableContentContainer = $(".variable-content-row", container);
      addAppropriateModalClass();
      initInputRefs();
      initInputs();
      setValues(model.getEvent());
      initEvents();
    },

    toggleRepeatSettings : function toggleRepeatSettings(evt) {
      toggleModal(evt);
    }
  };

  return Repeat_Settings;

})();
