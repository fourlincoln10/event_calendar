/**
 * Event Entry Controller
 */
Event_Calendar.Entry = (function(){
  "use strict";

  var model,
      container,
      bi,
      rs;

  /**
   * Event Entry Constructor
   * @param {Object} evt An object containing event properties
   */
  function Entry(containerSelector, values) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Entry(): Unable to locate container");
    }
    model = new Event_Calendar.Model(values);
    container.html(Event_Calendar.Templates.entry_container);
    bi = new Event_Calendar.Basic_Inputs(".basic-inputs-container", this);
    bi.render(values);
    rs = new Event_Calendar.Repeat_Settings(".repeat-settings-container", this);
    rs.render();
    initEvents();
  }

  /**
   * Private Functions
   */
  function initEvents() {
    // Set up the events we are going to listen to
    container.off();
    container.on("pushButtonSelected", function(){console.log("pushButtonSelected");});
    container.on("pushButtonDeselected", function(){console.log("pushButtonDeselected");});
  }
  

  /**
   * API 
   */
  Entry.prototype = {

    /**
     * Render inputs
     */
    setEvent : function setEvent(values) {
      var res = model.setEvent(values);
      if(res instanceof Error) {
        // Pass errors to all views
      }
      else {
        return true;
      }
    },

    toggleRepeatSettings : function toggleRepeatSettings(evt){
      rs.toggleRepeatSettings(evt);
    }
    
    
  };

  return Entry;

})();
