/**
 * Custom errors
 * @return {Object} Object containing custom error functions
 */
Event_Calendar.Errors = (function(){
  
  "use strict";

 /**
   * Custom error objects
   * @param  {String} msg A short description of the error
   * @param  {String} eventProp The event property the error applies to e.g. "freq"
   * @return undefined Use the new operator when instantiating e.g. new InvalidError("a msg");
   */
function InvalidError(msg, eventProp) {
   Error.captureStackTrace(this);
   this.message = msg || "Invalid";
   this.eventProperty = eventProp || "";
}
InvalidError.prototype = Object.create(Error.prototype);


function UnknownPropertyError(msg, eventProp) {
   Error.captureStackTrace(this);
   this.message = msg || "Unknown Property";
   this.eventProperty = eventProp || "";
}
UnknownPropertyError.prototype = Object.create(Error.prototype);


function RequiredError(msg, eventProp) {
   Error.captureStackTrace(this);
   this.message = msg || "Required";
   this.eventProperty = eventProp || "";
}
RequiredError.prototype = Object.create(Error.prototype);

/**
  * Error Group
  * @param  {String} msg A short description
  * @param  {String} errors An array of errors
  * @return undefined Use the new operator when instantiating e.g. new InvalidError("a msg");
  */
function ErrorGroup(msg, errors) {
   Error.captureStackTrace(this);
   this.message = msg || "One or more errors were detected";
   this.errors = errors || [];
}
ErrorGroup.prototype = Object.create(Error.prototype);


var api = {
  InvalidError : InvalidError,
  UnknownPropertyError: UnknownPropertyError,
  RequiredError: RequiredError,
  ErrorGroup: ErrorGroup
};

return api;

})();
