/**
 * Model
 * @return {Function} Model contructor function
 */
Event_Calendar.Model = (function(){
  "use strict";

  var v = Event_Calendar.Validate;

  function Model(data){
    this.data = null;
    if(data) {
      if(v.validateEvent(data)) {
        this.data = data;
      }
      else {
        console.log("Event_Calendar.Model() Invalid data passed to constructor");
      }
    }
  }

  Model.prototype = {

    /**
     * Get data
     */

    getProperty : function getProperty(prop) {
      return this.data[prop];
    },

    getEvent : function getEvent() {
      return _.extend({}, this.data);
    },

    /**
     * Set Data
     */
    setProperty : function setProperty(prop, val) {
      var err;
      if(Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW.indexOf(prop) === -1) {
        err = new Event_Calendar.Errors.UnknownPropertyError("Unknown property", prop);
        return this.publishError(err);
      }
      else if(!v.validateProperty(prop, val)) {
        err = new Event_Calendar.Errors.InvalidError("Invalid " + prop, prop);
        return this.publishError(err);
      }
      // Validate event as a whole so errors involving multiple properties are caught.
      var e = this.getEvent();
      e[prop] = val;
      var validationErrors = v.validateEvent(e);
      if(validationErrors.length > 0) {
        err = new Event_Calendar.Errors.ErrorGroup(validationErrors);
        return this.publishError(err);
      }
      this.data[prop] = val;
      return this.publishEvent("ceModelUpdated", e);
    },

    setEvent : function setFieldsEditableByView(fields) {
      this.publishEvent("ceModelSetFieldsEditableByView");
      if(!fields) return;
      fields = _.pick(fields, Event_Calendar.Cfg.FIELDS_MANAGED_BY_VIEW);
      var temp = _.extend({}, this.data, fields);
      var validationErrors = v.validateEvent(temp);
      if(validationErrors.length === 0) {
        this.data = temp;
        return this.publishEvent("ceModelUpdated", this.getEvent());
      }
      var err = new Event_Calendar.Errors.ErrorGroup(validationErrors);
      return this.publishError(err);
    },

    /**
     *  Remove data
     */
    removeProperty : function removeProperty(prop) {
      if(typeof this.data[prop] !== "undefined") {
        delete this.data[prop];
        return this.publishEvent("ceModelUpdated", this.getEvent());
      }
    },

    /**
     * Publish Events
     */
    publishError : function publishError(err) {
      amplify.publish("ceModelError", err);
      return err;
    },

    publishEvent : function publishEvent(evtType, data) {
      if(data) {
        amplify.publish(evtType, data);
      }
      else {
        amplify.publish(evtType);
      }
      return data;
    }
  };

  return Model;

})();
