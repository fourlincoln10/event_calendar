/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  /**
   * Private Properties / Functions
   */
  var v = Event_Calendar.Validate;
  var data = {};
  var savedState = null;

  function publish(evtType, data) {
    postal.publish({
      topic: "model." + evtType,
      data: data || {}
    });
    return data;
  }

  function subscribe(topic, callback) {
    postal.subscribe({
      topic: topic,
      callback: callback
    });
  }

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(evt){
    if(evt) {
      this.setEvent(evt);
    }
  }

  /**
   * API
   */
  Model.prototype = {

    /**
     * Get data
     */
    getSavedState : function getSavedState() {
      return _.extend({}, savedState);
    },

    getProperty : function getProperty(prop) {
      return data[prop];
    },

    getEvent : function getEvent() {
      return _.extend({}, data);
    },

    /**
     * Set Data
     */
    setProperty : function setProperty(prop, val) {
      var err;
      if(Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW.indexOf(prop) === -1) {
        err = new Event_Calendar.Errors.UnknownPropertyError("Unknown property", prop);
        return publish("error", err);
      }
      else if(!v.validateProperty(prop, val)) {
        err = new Event_Calendar.Errors.InvalidError("Invalid " + prop, prop);
        return publish("error", err);
      }
      // Validate event as a whole so errors involving multiple properties are caught.
      var e = this.getEvent();
      e[prop] = val;
      var validationErrors = v.validateEvent(e);
      if(validationErrors.length > 0) {
        err = new Event_Calendar.Errors.ErrorGroup(validationErrors);
        return publish("error", err);
      }
      data[prop] = val;
      return publish("updated", e);
    },

    setEvent : function setEvent(evt) {
      publish("setevent");
      if(!evt) return;
      evt = _.pick(evt, Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW);
      var temp = _.extend({}, data, evt);
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length === 0) {
        data = temp;
        if(!savedState) savedState = _.extend({}, temp);
        return publish("updated", this.getEvent());
      } 
      else {
        var err = new Event_Calendar.Errors.ErrorGroup(null, validationErrors);
        return publish("error", err);
      }
    },

    /**
     *  Remove data
     */
    removeProperty : function removeProperty(prop) {
      if(typeof data[prop] !== "undefined") {
        delete data[prop];
        return publish("updated", this.getEvent());
      }
    },

    // MAKE THIS PRIVATE...HERE FOR TESTING PURPOSES ONLY
    diff : function diff() {
      if(!savedState) return;
      var tempData = _.pick(data, _.identity); // Remove falsy values
      var tempSavedState = _.pick(savedState, _.identity); // Remove falsy values
      var newProps = _.difference(Object.keys(tempData), Object.keys(tempSavedState));
      var diffProps = _.omit(tempData, function(v,k) { return tempSavedState[k] === v; });
      return _.extend(newProps, diffProps);
    }

  };

  return Model;

})();
