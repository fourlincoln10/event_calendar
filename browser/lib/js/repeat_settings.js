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

  function toggleRsWindow(evt) {
    console.log("toggleRsWindow()");
    var wind = container,
        closeWindowBtn = $( "button.close", wind),
        showWindowClass = "rs-window-show",
        transEndEventNames = {
          "WebkitTransition" : "webkitTransitionEnd",
          "MozTransition" : "transitionend",
          "OTransition" : "oTransitionEnd",
          "msTransition" : "MSTransitionEnd",
          "transition" : "transitionend"
        },
        transEndEventName = transEndEventNames[ Modernizr.prefixed( "transition" ) ],
        support = { transitions : Modernizr.csstransitions };

    wind.addClass( "rs-window" );
    closeWindowBtn.off().on("click", toggleRsWindow);
    
    function onEndTransitionFn( evt ) {
      if( evt.originalEvent.propertyName !== "visibility" ) return;
      wind.off( transEndEventName, onEndTransitionFn );
      wind.removeClass( showWindowClass );
    }

    if(wind.hasClass( showWindowClass ) ) {
      wind.removeClass( showWindowClass );
      if( support.transitions ) {
        wind.off().on( transEndEventName, onEndTransitionFn );
      }
      else {
        wind.removeClass( showWindowClass );
      }
    }
    else {
      wind.addClass( showWindowClass );
    }
  }

  function toggleRsOverlay(evt) {

  }

  /**
   * API 
   */
  Repeat_Settings.prototype = {
    render : function render(values) {
      values = values || {};
      container.html(Event_Calendar.Templates.persistent_repeat_inputs);
      initInputs(values);
      initEvents();
    },

    toggleRepeatSettings : function toggleRepeatSettings(evt) {
      var viewportWidth = document.documentElement.clientWidth;
      return viewportWidth > smScreenBreakPoint ? toggleRsWindow(evt) : toggleRsOverlay(evt);
    }
  };

  return Repeat_Settings;

})();
