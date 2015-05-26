/**
 * Event Entry Controller
 */
Event_Calendar.Entry = (function(){
  "use strict";

  var model,
      container,
      bi,         // basic inputs
      biCnt,      // basic inputs container
      rs,         // repeat setting inputs
      rsCnt,      // repeat settings container
      eh;         // error handler

  /**
   * Event Entry Constructor
   * @param {Object} evt An object containing event properties
   */
  function Entry(containerSelector, values) {
    container = $(containerSelector);
    if(container.length === 0) {
      throw new Error("Entry(): Unable to locate container");
    }
    container.html(Event_Calendar.Templates.entry_container);
    biCnt = $(".basic-inputs-container");
    rsCnt = $(".repeat-settings-container");
    eh = new Event_Calendar.ErrorHandler(biCnt, rsCnt, container);
    model = new Event_Calendar.Model(container, this, values);
    bi = new Event_Calendar.Basic_Inputs(biCnt, this, model, container);
    bi.render(model.getEvent());
    rs = new Event_Calendar.Repeat_Settings(rsCnt, container, model);
    rs.render();
  }

  /**
   * Private Functions
   */
  

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
