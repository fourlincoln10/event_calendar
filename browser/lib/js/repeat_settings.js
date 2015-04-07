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
    
  }

  function initEvents() {
    
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
        closeButton = $( ".close", modal),
        slidedownClass = "modal-slidedown",
        showClass = "show";

    closeButton.off().on("click", toggleModal);

    if(modal.hasClass( showClass ) ) {
      modal.removeClass( showClass );
    }
    else {
      addAppropriateModalClass();
      modal.addClass( showClass );
    }
  }

  /**
   * API 
   */
  Repeat_Settings.prototype = {
    render : function render(values) {
      values = values || {};
      container.html(Event_Calendar.Templates.persistent_repeat_inputs);
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
