/**
 * 
 * Error Handler
 */

Event_Calendar.ErrorHandler = (function(){
  "use strict";
  
  var container;

  function propertySet(p) {
    removePropError(p.prop);
  }
  
  function modelEventSetError(err) {
    removeAll();
    render(err);
  }

  function repeatPropertiesError(err) {
    removeRepeatPropertyErrors();
    render(err);
  }

  function errorsPresent() {
    return $(".error", container).length > 0;
  }
  function errorClass(prop) {
    return prop + "Error";
  }
  function removeAll() {
    $(".error", container).remove();
  }
  function removeRepeatPropertyErrors() {
    Event_Calendar.Cfg.REPEAT_PROPERTIES.forEach(function(prop){removePropError(prop);});
  }
  function removePropError(prop) {
    var cls = errorClass(prop);
    if(cls) {
      $("." + cls, container).remove();
    }
  }
  function insertInDom(msg, prop) {
      if( !prop ) return console.error(msg);
      var html = "<div class='error " + errorClass(prop) + "'>" + msg + "</div>";
      // summary
      if( prop == "summary" ) {
        $(".title-row label:first-of-type", container).after(html);
      } 
      // dtstart, dtstartdate, dtstarttime, dtend, dtenddate, dtstarttime
      else if(    prop == "dtstart" ||  prop == "dtstartdate" || prop == "dtstarttime" ||
                  prop == "dtend"   ||  prop == "dtenddate"   || prop == "dtendtime"  )  {
        $(".date-row label:first-of-type", container).after(html);
      }
      // location
      else if( prop == "location" ) {
        $(".location-row label:first-of-type", container).after(html);
      }
      // description
      else if( prop == "description" ) {
        $(".description-row label:first-of-type", container).after(html);
      }
      // freq
      else if( prop == "freq" ) {
        $(".freq-row", container).prepend(html);
      }
      // interval
      else if( prop == "interval" ) {
        $(".interval-row", container).prepend(html);
      }
      // count, until
      else if ( prop == "until" || prop == "count" ) {
        $(".end-row", container).prepend(html);
      }
      // byday
      else if ( prop == "byday" ) {
        $(".weekday-row, .monthday-occurrence-row, .year-day-row", container).prepend(html);
      }
      // bymonthday
      else if (prop == "bymonthday") {
        $(".monthday-numeric-row", container).prepend(html);
      }
      // bysetpos
      else if ( prop == "bysetpos" ) {
        $(".monthday-occurrence-row, .year-day-row", container).prepend(html);
      }
      // bymonth
      else if ( prop == "bymonth" ) {
        $(".year-month-row", container).prepend(html);
      }
      // unknown property
      else {
        console.error("Unknown property: " + prop);
        console.error("Error msg: ", msg);
      }
  }
  
  function render(err) {
    err = err.errors || [err];
    err.forEach(function(e) {
      removePropError(e.eventProperty);
      insertInDom(e.message, e.eventProperty);
    });
  }

  // API
  var api = {
    container : container,
    errorsPresent : errorsPresent,
    render : render, 
    removePropError : removePropError,
    removeRepeatPropertyErrors : removeRepeatPropertyErrors,
    removeAll : removeAll
  };

  return api;
})();
