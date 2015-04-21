/**
 * Event Repeat Settings
 * @return {Function} Repeat settings constructor function
 */
Event_Calendar.Repeat_Settings = (function(){
  "use strict";

  var container,
      controller,
      rsChoice,
      rsContainer,
      variableContentContainer,
      pb,
      smScreenBreakPoint = 550;

  /**
   * Constructor
   * @param {Object} evt An object containing event properties
   */
  function Repeat_Settings(containerSelector, cont) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Basic_Inputs(): Unable to locate container");
    }
    controller = cont;
  }

  /**
   * Private Functions
   */
  
  function initInputs() {
    addAppropriateModalClass();
  }

  function initEvents() {
    // Add appropriate modal class when resize ends
    $(window).off("resize").on("resize", _.debounce(function(){
      addAppropriateModalClass();
    }, 500));
    // Close button
    $( ".close", container).off().on("click", toggleModal);
  }

  function supportsTransitions() {
    return Modernizr.csstransitions;
  }

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

  function renderVariableContent (values) {
    if(values && values.freq == "weekly") {
      variableContentContainer.html(Event_Calendar.Templates.weekly_freq_day_of_week);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 7,
        buttonWidth: 25,
        buttonHeight: 25,
        data: [{text: 'SU', value: 'su'},{text: 'MO', value: 'mo'},{text: 'TU', value: 'tu'},{text: 'WE', value: 'we'},{text: 'TH', value: 'th'},{text: 'FR', value: 'fr'},{text: 'SA', value: 'sa'}]
      });
    }
    else if(values && values.freq == "monthly") {
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
    else if(values && values.freq == "yearly") {
      variableContentContainer.html(Event_Calendar.Templates.yearly_freq_month_selection);
      pb = new Event_Calendar.PushButtons(".pushbutton-container", controller);
      pb.render({
        numCols: 6,
        buttonWidth: 28,
        buttonHeight: 28,
        data: [
          {text: 'Jan', value: 1},{text: 'Feb', value: 2},{text: 'Mar', value: 3},
          {text: 'Apr', value: 4},{text: 'May', value: 5},{text: 'Jun', value: 6},
          {text: 'Jul', value: 7},{text: 'Aug', value: 8},{text: 'Sep', value: 9},
          {text: 'Oct', value: 10},{text: 'Nov', value: 11},{text: 'Dec', value: 12}
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
    // daily, weekly, monthly - numeric day, monthly - day occ, yearly
    
    render : function render(values) {
      values = values || {};
      container.html(Event_Calendar.Templates.persistent_repeat_inputs);
      variableContentContainer = $(".variable-content-row", container);
      values.freq = "weekly";
      renderVariableContent(values);       
      addAppropriateModalClass();
      initInputs(values);
      initEvents();
    },

    toggleRepeatSettings : function toggleRepeatSettings(evt) {
      toggleModal(evt);
    }
  };

  return Repeat_Settings;

})();
