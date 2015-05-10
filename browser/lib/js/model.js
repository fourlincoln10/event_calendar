/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(values, cnt){
    data = {};
    values = values || defaultValues();
    savedState = null;
    controller = cnt;
    this.setEvent(values);
  }


  /**
   * Private Properties / Functions
   */
  var v = Event_Calendar.Validate,
      data,
      savedState,
      controller;

  function publish(evtType, data) {
    postal.publish({
      topic: "ecmodel." + evtType,
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

  function processOutgoingEvent(values) {
    Object.keys(values).forEach(function(key){
      values[key] = processOutgoingProperty(key, values[key]);
    });
    return values;
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
      dtstart: moment(roundDateToNearestHalfHour(new Date())).format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT),
    };
    defaults.dtend = moment(defaults.dtstart).add(1, "hour").format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT);
    return defaults;
  }

  // Translates data into form appropriate for storage
  function formatTransition(prop, val) {
    if(prop == "interval" && val) {
      try { val = parseInt(val, 10); } catch(e) { controller.modelError(e); }
    }
    if(prop == "count" && val) {
      try { val = parseInt(val, 10); } catch(e) { controller.modelError(e); }
    }
    if(prop == "until" && val) {
      var dtstart = moment(data.dtstart);
      val = moment(val).hours(dtstart.hours()).minutes(dtstart.minutes()).format(Event_Calendar.Cfg.MOMENT_DATE_TIME_FORMAT);
      val = Event_Calendar.Helpers.convertDateTimeStrToUTC(val);
    }
    return val;
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
      return _.clone(data[prop]);
    },

    getEvent : function getEvent() {
      return _.extend({}, data);
    },

    /**
     * Set Data
     */
    setProperty : function setProperty(prop, val) {
      //if(true) return publish("property_set_error", new Event_Calendar.Errors.InvalidError("Test " + prop + " error", prop));
      var err;
      if(Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW.indexOf(prop) === -1) {
        err = new Event_Calendar.Errors.UnknownPropertyError("Unknown property", prop);
        return publish("property_set_error", err);
      }
      // If setting to "", null etc. remove instead
      if(!val) {
        return this.removeProperty(prop);
      }
      // Format/Validate individual property
      val = formatTransition(prop, val);
      if(!v.validateProperty(prop, val)) {
        err = new Event_Calendar.Errors.InvalidError("Invalid " + prop, prop);
        return publish("property_set_error", err);
      }
      // Validate event as a whole so errors involving multiple properties are caught.
      var e = this.getEvent();
      e[prop] = val;
      var validationErrors = v.validateEvent(e);
      if(validationErrors.length > 0) {
        err = new Event_Calendar.Errors.ErrorGroup("", validationErrors);
        return publish("property_set_error", err);
      }
      // Success!
      data[prop] = val;
      return publish("property_set", {prop: prop, val: val});
    },

    setEvent : function setEvent(evt) {
      if(!evt) return;
      evt = _.pick(evt, _.identity); // Only allow properties that have a truthy value
      var temp = _.extend({}, data, evt);
      if(!temp.freq) temp = _.omit(temp, Event_Calendar.Cfg.REPEAT_PROPERTIES);
      Object.keys(temp).forEach(function(key){temp[key] = formatTransition(key, temp[key]);});
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length > 0) {
        var err = new Event_Calendar.Errors.ErrorGroup(null, validationErrors);
        return publish("event_set_error", err);
      } 
      // Success!
      data = temp;
      return publish("event_set", this.getEvent());
    },

    setRepeatProperties : function setRepeatProperties(props) {
      var temp = _.extend({}, _.omit(data, Event_Calendar.Cfg.REPEAT_PROPERTIES), props);
      Object.keys(temp).forEach(function(key){temp[key] = formatTransition(key, temp[key]);});
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length > 0) {
        var err = new Event_Calendar.Errors.ErrorGroup(null, validationErrors);
        return publish("repeat_properties_set_error", err);
      } 
      // Success!
      data = temp;
      if(!savedState) savedState = _.extend({}, data);
      return publish("repeat_properties_set", _.pick(temp, Object.keys(props)));
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
      return publish("property_removed", prop);
    },

    removeRepeatProperties : function removeRepeatProperties() {
      this.removeProperty("freq"); // This will remove all repeat properties
    },

    /**
     * Save
     */
    save : function save() {
      // Insert save to server code here.
      // if(!savedState) savedState = _.extend({}, temp);
      // return publish("saved", getEvent());
    }
  };

  return Model;

})();
