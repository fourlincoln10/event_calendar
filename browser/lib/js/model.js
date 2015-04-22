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
  var data, savedState;

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
   * Diff : Calculate changes since the last time state was saved
   * Goal is to identify: 
   *  1. Properties that are not in data that are in savedState
   *  2. Properties that are not in savedState but are in data
   *  3. Properties that are in both objects but have different values
   * @return {Object} Object containing properties that are "different" (see goal above)
  */
  function diff() {
    if(!savedState) return;
    var tempData = JSON.parse(JSON.stringify(data));
    var tempSavedState = JSON.parse(JSON.stringify(savedState));
    // Values from saved state that do not exist in data
    // 1. Properties that are not in data that are in savedState
    //    Set to falsy to indicate that the property has been changed and should be removed
    var old = _.pick(tempSavedState, _.difference(Object.keys(tempSavedState), Object.keys(tempData)));
    Object.keys(old).forEach(function(key){old[key] = typeof old[key] === "string" ? "" : null;});
    //  2. Properties that are not in savedState but are in data
    //  3. Properties that are in both objects but have different values
    var d = _.omit(tempData, function(v,k) { return tempSavedState[k] === v; });
    return _.extend(d, old);
  }

  function roundDateToNearestHalfHour(dt) {
    var coeff = 1000 * 60 * 30; // 1000 ms/sec * 60 sec/min * 30 min/1 = 1800000 ms.
    var roundedMs = Math.ceil(dt.getTime() / coeff) * coeff; // Round up to nearest 30 mins and convert to ms
    return new Date(roundedMs);
  }

  function defaultValues() {
    var defaults = {
      freq: "daily", 
      interval: 1,
      dtstart: moment(roundDateToNearestHalfHour(new Date())).format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT),
    };
    defaults.dtend = moment(defaults.dtstart).add(1, "hour").format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT);
    return defaults;
  }

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(values){
    data = {};
    values = values || defaultValues();
    savedState = null;
    this.setEvent(values);
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
      // If setting to "", null etc. remove instead
      if(!prop) {
        return this.removeProperty(prop);
      }
      if(!v.validateProperty(prop, val)) {
        err = new Event_Calendar.Errors.InvalidError("Invalid " + prop, prop);
        return publish("error", err);
      }
      // Validate event as a whole so errors involving multiple properties are caught.
      var e = this.getEvent();
      e[prop] = val;
      var validationErrors = v.validateEvent(e);
      if(validationErrors.length > 0) {
        err = new Event_Calendar.Errors.ErrorGroup("", validationErrors);
        return publish("error", err);
      }
      data[prop] = val;
      return publish("updated", e);
    },

    setEvent : function setEvent(evt) {
      publish("setevent");
      if(!evt) return;
      evt = _.pick(evt, _.identity); // Only allow properties that have a truthy value
      var temp = _.extend({}, data, evt);
      if(!temp.freq) temp = _.omit(temp, Event_Calendar.Cfg.REPEAT_PROPERTIES);
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
      prop = Array.isArray(prop) ? prop : [prop];
      prop.forEach(function(p){
        if(typeof data[p] !== "undefined") {
          delete data[p];
          // Can't have an RRule w/o a freq
          if(p == "freq") {
            data = _.omit(data, Event_Calendar.Cfg.REPEAT_PROPERTIES);
          }
        }
      });
      return publish("updated", this.getEvent());
    }

  };

  return Model;

})();
