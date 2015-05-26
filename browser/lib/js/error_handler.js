/**
 * 
 * Error Handler
 */

Event_Calendar.ErrorHandler = (function(){
  "use strict";
  
  var basicInputsContainer,
      repeatSettingsContainer,
      rootContainer;

  function ErrorHandler(biCnt, rsCnt, rootCnt) {
    basicInputsContainer = biCnt;
    repeatSettingsContainer = rsCnt;
    rootContainer = rootCnt;
    initEvents();
  }

  function initEvents() {
    rootContainer.on("model.error", modelError);
    rootContainer.on("model.set", modelSet);
  }

  function modelSet(evt, prop) {
    if(typeof prop == "object") {
      Object.keys(prop).forEach(function(k){removePropError(k, prop[k]);});
    } else {
      removePropError(prop);
    }
  }

  function modelError(evt, err) {
    render(err);
  }
  
  function modelSaveError(err) {
    removeAll();
    render(err);
  }

  function errorsPresent() {
    return $(".error", rootContainer).length > 0;
  }

  function errorClass(prop) {
    return prop + "Error";
  }

  function removeAll() {
    $(".error", rootContainer).remove();
  }

  function removePropError(prop) {
    var cls = errorClass(prop);
    if(cls) {
      $("." + cls, rootContainer).remove();
    }
  }
  function insertInDom(msg, prop) {
    if( !prop ) return console.error(msg);
    var html = "<div class='error " + errorClass(prop) + "'>" + msg + "</div>";
    // summary
    if( prop == "summary" ) {
      $(".title-row label:first-of-type", rootContainer).after(html);
    } 
    // dtstart, dtstartdate, dtstarttime
    else if( prop == "dtstart" ||  prop == "dtstartdate" || prop == "dtstarttime" ) {
      $(".dtstart-group", rootContainer).prepend(html);
    }
    // dtend, dtenddate, dtstarttime
    else if ( prop == "dtend"   ||  prop == "dtenddate"   || prop == "dtendtime"  ) {
      $(".dtend-group", rootContainer).prepend(html);
    }
    // location
    else if( prop == "location" ) {
      $(".location-row label:first-of-type", rootContainer).after(html);
    }
    // description
    else if( prop == "description" ) {
      $(".description-row label:first-of-type", rootContainer).after(html);
    }
    // freq
    else if( prop == "freq" ) {
      $(".freq-row", rootContainer).prepend(html);
    }
    // interval
    else if( prop == "interval" ) {
      $(".interval-row", rootContainer).prepend(html);
    }
    // count, until
    else if ( prop == "until" || prop == "count" ) {
      $(".end-row", rootContainer).prepend(html);
    }
    // byday
    else if ( prop == "byday" ) {
      $(".weekday-row, .monthday-occurrence-row, .year-day-row", rootContainer).prepend(html);
    }
    // bymonthday
    else if (prop == "bymonthday") {
      $(".monthday-numeric-row", rootContainer).prepend(html);
    }
    // bysetpos
    else if ( prop == "bysetpos" ) {
      $(".monthday-occurrence-row, .year-day-row", rootContainer).prepend(html);
    }
    // bymonth
    else if ( prop == "bymonth" ) {
      $(".year-month-row", rootContainer).prepend(html);
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
    errorsPresent : errorsPresent,
    render : render, 
    removePropError : removePropError,
    removeAll : removeAll
  };

  ErrorHandler.prototype = api;

  return ErrorHandler;

})();
