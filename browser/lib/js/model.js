/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  /**
   * Private Properties
   */
  var cfg,
      container,
      controller,
      data,
      savedState,
      v = Event_Calendar.Validate;

  /**
   * Model Constructor
   * @param {Object} evt An object containing event properties
   */
  function Model(cont, ctrl, values) {
    cfg = Event_Calendar.Cfg;
    container = cont;
    controller = ctrl;
    data = {};
    savedState = null;
    values = values || defaultValues();
    this.set(values);
  }

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

  function defaultValues() {
    var dtstart = moment(Event_Calendar.Helpers.roundDateToNearestHalfHour(new Date())).format(cfg.MOMENT_DATE_TIME_FORMAT);
    var dtend = moment(dtstart).add(1, "hour").format(cfg.MOMENT_DATE_TIME_FORMAT);
    return {
      dtstart: dtstart,
      dtend: dtend
    };
  }

  // Translates data into form appropriate for storage
  function formatTransition(attrs) {
    if( attrs.interval ) {
      attrs.interval = parseInt(attrs.interval, 10);
    }
    if( attrs.count ) {
      attrs.count = parseInt(attrs.count, 10);
    }
    if( attrs.until ) {
      var dtstart = moment(data.dtstart);
      attrs.until = moment(attrs.until).hours(dtstart.hours()).minutes(dtstart.minutes()).format(cfg.MOMENT_DATE_TIME_FORMAT);
      attrs.until = Event_Calendar.Helpers.convertDateTimeStrToUTC(attrs.until);
    }
    return attrs;
  }

  /**
   * API
   */
  Model.prototype = {

    toggleAllDay : function toggleAllDay(isAllDay) {
      var dtstart, dtend, roundedNow;
      if(isAllDay) {
        dtstart = moment(this.getProperty("dtstart")).format(cfg.MOMENT_DATE_FORMAT);
        dtend = moment(this.getProperty("dtend")).format(cfg.MOMENT_DATE_FORMAT);
      } else {
        roundedNow = moment(Event_Calendar.Helpers.roundDateToNearestHalfHour(new Date()));
        dtstart = moment(this.getProperty("dtstart")).hour(roundedNow.hour()).minute(roundedNow.minute()).format(cfg.MOMENT_DATE_TIME_FORMAT);
        dtend = moment(this.getProperty("dtend")).hour(roundedNow.hour()).minute(roundedNow.minute()).format(cfg.MOMENT_DATE_TIME_FORMAT);
      }
      this.set({dtstart: dtstart, dtend: dtend});
    },
    
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

    getRepeatProperties : function getRepeatProperties() {
      return _.pick(data, Event_Calendar.Cfg.REPEAT_PROPERTIES);
    },

    /**
     * Set Data
     */
     
    set : function set(key, val) {
      var attr, attrs, prev, previousAttributes, curr, currentAttributes, changes, ret;
      if (key === null) return this;
      container.trigger("model.set", [key, val]); // Enables error removal from DOM
      // Allow both (key, value) and ({key: value}) arguments
      if (typeof key === "object") {
        attrs = key;
      } else {
        (attrs = {})[key] = val;
      }
      attrs = formatTransition(attrs);
      if(_.intersection(Event_Calendar.Cfg.REPEAT_PROPERTIES, Object.keys(attrs)).length > 0) {
        return this.setRepeatProperties(attrs);
      }
      changes = [];
      prev = this.getEvent();
      curr = this.getEvent();
      for(attr in attrs) {
        val = attrs[attr];
        if ( !_.isEqual(prev[attr], val) ) {
          changes.push(attr);
          curr[attr] = val;
        }
      }
      ret = v.validateEvent(curr);
      if(ret instanceof Error) {
        container.trigger("model.error", ret);
      } else {
        data = curr;
        changes.forEach(function(attr) {
          container.trigger("model.change", [attr, curr[attr]]);
        });
      }
      return this;
    },

    setEvent : function setEvent(evt) {
      if(!evt) return;
      evt = _.pick(evt, _.identity); // Only allow properties that have a truthy value
      var temp = _.extend({}, data, evt);
      if(!temp.freq) temp = _.omit(temp, cfg.REPEAT_PROPERTIES);
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
      var temp = _.extend({}, _.omit(data, cfg.REPEAT_PROPERTIES), props);
      temp = formatTransition(temp);
      var ret = v.validateEvent(temp);
      if(ret instanceof Error) {
        container.trigger("model.error", ret);
        return this;
      }
      data = temp;
      container.trigger("model.change", ["rrule", this.getRepeatProperties()]);
      return this;
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
            data = _.omit(data, cfg.REPEAT_PROPERTIES);
          }
        }
      });
      container.trigger("model.removed", prop);
      return this;
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