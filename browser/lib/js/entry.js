/**
 * Event Entry Form
 * @return {Function} Model contructor function
 */
Event_Calendar.Entry = (function(){
  "use strict";

  var container, model;

  /**
   * Event Entry Constructor
   * @param {Object} evt An object containing event properties
   */
  function Entry(containerSelector, evt) {
    container = $(containerSelector);
    model = new Event_Calendar.Model(evt);
  }

  function initEvent() {
    container.off();

  }

  /**
   * API 
   */
  Entry.prototype = {

    /**
     * Render inputs
     */
    render : function render() {
      container.html(Event_Calendar.Templates.entry_inputs);
      var dtstart = model.getProperty(dtstart) ? new Date(model.getProperty(dtstart)) : 
                                                 new Date();
      $(".dtstart-date", container).kendoDatePicker({
        value : dtstart,
        parseFormats: ["MM/dd/yyyy"],
        min: new Date("01/01/1970")
      });
      //initEvents();
    }
    
  };

  return Entry;

})();
