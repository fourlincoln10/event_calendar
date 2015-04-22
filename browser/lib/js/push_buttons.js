/**
 * Push Buttons
 */
Event_Calendar.PushButtons = (function(){
  "use strict";

  var container,
      controller,
      buttonElement = "td:not(.filler)",
      selectedData = [];


  function PushButtons(containerSelector, cnt){
    container = $(containerSelector);
    if(container.length === 0) {
      console.error("PushButtons(): Unable to locate container.");
    }
    controller = cnt;
    registerEvents();
  }

  function registerEvents () { 
    container.off("click", buttonElement).on("click", buttonElement, buttonClicked);
  }

  function buttonClicked (evt) {
    evt.preventDefault();
    var target = $(evt.target);
    var val = target.data("value");
    if(target.hasClass("selected")) {
      removeSelectedData(val);
      target.removeClass("selected");
      container.trigger("pushButtonDeselected", val);
    }
    else {
      addSelectedData(val);
      target.addClass("selected");
      container.trigger("pushButtonSelected", val);
    }
  }

  function findCell(d) {
    return $("td", container).filter(function(){
      return $(this).data("value") == d;
    }).eq(0);
  }

  function set(data) {
    removeAllData();
    (data || []).forEach(function(d){
      var cell = findCell(d);
      if(cell) {
        addSelectedData(d);
        cell.addClass("selected");
      }
    });
    container.trigger("pushButtonDataLoaded", selectedData);
  }

  function addSelectedData(val) {
    if(typeof val == "undefined" || !val) { return; }
    selectedData.push(val);
  }

  function removeAllData() {
    $("td.selected", container).removeClass("selected");
    selectedData = [];
    container.trigger("pushButtonsDataRemoved", selectedData);
  }

  function removeSelectedData(val) {
    if(typeof val == "undefined" || !val) { return; }
    var idx = selectedData.indexOf(val);
    if(idx > -1) {
      selectedData.splice(idx, 1);
    }
  }

  function getSelectedData() {
    return JSON.parse(JSON.stringify(selectedData));
  }

  /**
   * Render pushbuttons
   * @param  {Object} opts Render options. Possible values are:
   *   opts.numCols -> Number of columns
   *   opts.buttonWidth -> Width of a button
   *   opts.buttonHeight -> Height of a button
   *   opts.data -> The data to render
   * @return {undefined}
   */
  function render(opts) {
    opts = opts || {};
    opts.numCols = opts.numCols || 7;
    opts.buttonWidth = opts.buttonWidth || 25;
    opts.buttonHeight = opts.buttonHeight || 25;
    opts.data = opts.data || [];
    if(opts.data.length === 0) {
      return;
    }
    var table = $("<table cellspacing='0' class='pushButtonsTable'></table>");
    var row = $("<tr></tr>");
    table.append(row);
    var i, l, colCounter, cell;
    for(i = 0, l = opts.data.length, colCounter = 1; i < l; ++i, ++colCounter) {
      cell = $("<td>" + opts.data[i].text + "</td>");
      cell.data("value", opts.data[i].value);
      cell.css({width: opts.buttonWidth + "px", height: opts.buttonHeight + "px"});
      row.append(cell);
      if(i < (opts.data.length - 1) && colCounter >= opts.numCols) {
        row = $("<tr></tr>");
        colCounter = 0;
        table.append(row);
      }
    }
    if(colCounter <= opts.numCols) {
      cell = $("<td class='filler' colspan='" + (opts.numCols - colCounter + 1) + "'></td>");
      row.append(cell);
    }
    container.html(table);
  }

  var api = {
    render : render,
    set : set
  };

  PushButtons.prototype = api;

  return PushButtons;

})();
