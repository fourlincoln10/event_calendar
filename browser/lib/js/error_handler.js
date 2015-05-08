/**
 * 
 * Error Handler
 */

Event_Calendar.ErrorHandler = (function(){
  "use strict";
  
  var container;
  
  function ErrorHandler(cnt) {
    container = cnt;
  }
  
  function errorsPresent() {
    return $(".error", container).length > 0;
  }
  function errorClass(prop) {
    return prop ? "error " + prop + "Error" : "error";
  }
  function removeAll() {
    $(".error", container).remove();
  }
  function removePropError(prop) {
    var cls = errorClass(prop);
    if(cls) {
      $("." + cls, container).remove();
    }
  }
  function insertInDom(msg, prop) {
      if( !prop ) return console.error(msg);
      var html = "<div class='" + errorClass(prop) + "'>" + msg + "</div>";
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
      insertInDom(e.message, e.eventProperty);
    });
  }

  // API
  ErrorHandler.prototype = {
    render : render, 
    removePropError : removePropError,
    removeAll : removeAll
  };

  return ErrorHandler;
})();
