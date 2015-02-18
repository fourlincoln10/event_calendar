var CustomRecurrenceView = function(rm, containerSelector) {
  this.rm = rm;
  this.rowSelectors = ['.freqRow', '.intervalRow', '.weekDayRow', '.monthDayRow', '.yearMonthRow', '.yearDayRow', '.dtStartRow', '.endRow', '.buttonRow'];
  this.weekDayPushButtons = null;  // days of the week e.g. 'mo'
  this.monthDayPushButtons = null; // day of the month e.g 15
  this.yearMonthPushButtons = null; // month of the year e.g. 10
  this.containerSelector = containerSelector;
  this.container = $(containerSelector);
  if(this.container.length === 0) {
    return console.error('CustomRecurrenceView(): Unable to locate container.');
  }
  this.savedState = null;
  this.initInputs();
  this.registerEvents();
  this.loadData(this.rm.getFieldsEditableByView());
};

CustomRecurrenceView.prototype.initInputs = function() {
  this.container.html($('#customRecurrenceInputsTemplate').html());
  var dtStart = this.rm.getProperty('dtStart') || '';
  $(".dtStart", this.container).kendoDateTimePicker({
    value : dtStart,
    parseFormats: ["MM/dd/yyyy"],
    min: new Date('01/01/1970')
  });
  $(".until", this.container).kendoDateTimePicker({
    value : '',
    parseFormats: ["MM/dd/yyyy"],
    min: new Date('01/01/170')
  });
  this.weekDayPushButtons = new PushButtons('.weekDayContainer', this.container);
  this.weekDayPushButtons.render({
    numCols: 7,
    buttonWidth: 20,
    buttonHeight: 20,
    data: [{text: 'SU', value: 'su'},{text: 'MO', value: 'mo'},{text: 'TU', value: 'tu'},{text: 'WE', value: 'we'},{text: 'TH', value: 'th'},{text: 'FR', value: 'fr'},{text: 'SA', value: 'sa'}]
  });

  this.monthDayPushButtons = new PushButtons('.monthDayContainer .pushButtonContainer');
  this.monthDayPushButtons.render({
    numCols: 7,
    buttonWidth: 20,
    buttonHeight: 20,
    data: [
      {text: 1, value: 1},{text: 2, value: 2},{text: 3, value: 3},
      {text: 4, value: 4},{text: 5, value: 5},{text: 6, value: 6},
      {text: 7, value: 7},{text: 8, value: 8},{text: 9, value: 9},
      {text: 10, value: 10},{text: 11, value: 11},{text: 12, value: 12},
      {text: 13, value: 13},{text: 14, value: 14},{text: 15, value: 15},
      {text: 16, value: 16},{text: 17, value: 17},{text: 18, value: 18},
      {text: 19, value: 19},{text: 20, value: 20},{text: 21, value: 21},
      {text: 22, value: 22},{text: 23, value: 23},{text: 24, value: 24},
      {text: 25, value: 25},{text: 26, value: 26},{text: 27, value: 27},
      {text: 28, value: 28},{text: 29, value: 29},{text: 30, value: 30},
      {text: 31, value: 31}
    ]
  });

  this.yearMonthPushButtons = new PushButtons('.yearMonthContainer', this.container);
  this.yearMonthPushButtons.render({
    numCols: 6,
    buttonWidth: 25,
    buttonHeight: 25,
    data: [
      {text: 'Jan', value: 1},{text: 'Feb', value: 2},{text: 'Mar', value: 3},
      {text: 'Apr', value: 4},{text: 'May', value: 5},{text: 'Jun', value: 6},
      {text: 'Jul', value: 7},{text: 'Aug', value: 8},{text: 'Sep', value: 9},
      {text: 'Oct', value: 10},{text: 'Nov', value: 11},{text: 'Dec', value: 12}
    ]
  });

  // Hide end type select menus
  $('.countWrapper, .until', this.container).css('display', 'none');
  $('.countError, .untilError', this.container).css('display', 'none');

  // Init inline help
  $('a[data-help]', this.container).kendoTooltip({
    showOn: 'mouseenter',
    width: '300px',
    content: function(evt) {
      return $('<div/>').text(evt.target.data('help')).html();
    }
  });

  // Render the selected freqs
  var freq = this.rm.getProperty('freq');
  return freq ? this.renderFreq(freq) : this.renderNeverFreq();
};

CustomRecurrenceView.prototype.registerEvents = function() {
  $(document).off('change', this.containerSelector + ' input.dtStart').on('change', this.containerSelector + ' input.dtStart', this.setRecurrence.bind(this));
  $(document).off('change', this.containerSelector + ' input.interval').on('blur', this.containerSelector + ' input.interval', this.setRecurrence.bind(this));
  $(document).off('change', this.containerSelector + ' select.yearDayDropDown').on('change', this.containerSelector + ' select.yearDayDropDown', this.setRecurrence.bind(this));
  $(document).off(this.containerSelector + ' pushButtonSelected').on(this.containerSelector + ' pushButtonSelected', this.setRecurrence.bind(this));
  $(document).off(this.containerSelector + ' pushButtonDeselected').on(this.containerSelector + ' pushButtonDeselected', this.setRecurrence.bind(this));
  $(document).off('change', this.containerSelector + ' select.monthDayDropDown').on('change', this.containerSelector + ' select.monthDayDropDown', this.setRecurrence.bind(this));
  $(document).off('blur', this.containerSelector + ' input.count').on('blur', this.containerSelector + ' input.count', this.setRecurrence.bind(this));
  $(document).off('change', this.containerSelector + ' input.until').on('change', this.containerSelector + ' input.until', this.setRecurrence.bind(this));
  $(document).off('change', this.containerSelector + ' select.freq').on('change', this.containerSelector + ' select.freq', this.changeFreq.bind(this));
  $(document).off('change', this.containerSelector + ' select.monthDayOccurrenceNumber').on('change', this.containerSelector + ' select.monthDayOccurrenceNumber', this.changeMonthDayOccurrenceNumber.bind(this));
  $(document).off('change', this.containerSelector + ' select.yearDayOccurrenceNumber').on('change', this.containerSelector + ' select.yearDayOccurrenceNumber', this.changeYearDayOccurrenceNumber.bind(this));
  $(document).off('change', this.containerSelector + ' select.endType').on('change', this.containerSelector + ' select.endType', this.changeEndType.bind(this));
  $(document).off('click', this.containerSelector + ' .ok').on('click', this.containerSelector + ' .ok', this.ok.bind(this));
  $(document).off('click', this.containerSelector + ' .cancel').on('click', this.containerSelector + ' .cancel', this.cancel.bind(this));
  amplify.subscribe('recurrenceUpdated', this.loadData.bind(this));
  amplify.subscribe('customRepeatSelected', this.openWindow.bind(this));
};

/**
 * Event Handlers
 **/
CustomRecurrenceView.prototype.changeFreq = function(evt) {
  this.setRecurrence();
  var freq = $('select.freq', this.container).val();
  this.renderFreq(freq);
};

CustomRecurrenceView.prototype.changeMonthDayOccurrenceNumber = function(evt) {
  var val = $(evt.target).val();
  if(val == 'day') {
    this.showMonthDayInputs();
  }
  else {
    this.showMonthDayOccurrenceInputs();
  }
  this.setRecurrence();
};

CustomRecurrenceView.prototype.changeYearDayOccurrenceNumber = function(evt) {
  var val = $(evt.target).val();
  if(val === '') {
    $('.yearDayDropDown', this.container).css('display', 'none');
  }
  else {
    $('.yearDayDropDown', this.container).css('display', 'inline');
  }
  this.setRecurrence();
};

CustomRecurrenceView.prototype.changeEndType = function(evt) {
  var endType = $('.endType', this.container).val();
  if(endType == 'never') {
    this.showNeverEndType();
  }
  else if(endType == 'count') {
    this.showCountEndType();
  }
  else if(endType == 'until') {
    this.showUntilEndType();
  }
  this.setRecurrence();
  this.renderNextOccurrence();
};

CustomRecurrenceView.prototype.ok = function(evt) {
  if($('.error', this.container).length !== 0) {
    return amplify.publish('errorOnSubmit');
  }
  this.setRecurrence();
  this.closeWindow();
};

CustomRecurrenceView.prototype.cancel = function(evt) {
  evt.preventDefault();
  this.rm.setFieldsEditableByView(this.savedState);
  this.closeWindow();
};

/**
 *   Render
 **/

 // Table of month days...1-31
 CustomRecurrenceView.prototype.showMonthDayInputs = function() {
  $('.monthDayOccurrenceNumber', this.container).val('day');
  $('.monthDayContainer .pushButtonsTable', this.container).css('display', 'table');
  $('.monthDayDropDown', this.container).css('display', 'none');
};

// Drop down menus for choosing first, second, etc. day of the week
CustomRecurrenceView.prototype.showMonthDayOccurrenceInputs = function() {
  $('.monthDayDropDown', this.container).css('display', 'inline');
  $('.monthDayContainer .pushButtonsTable', this.container).css('display', 'none');
};

CustomRecurrenceView.prototype.showNeverEndType = function() {
  $('.countWrapper, .until', this.container).css('display', 'none');
  $('.countError, .untilError', this.container).css('display', 'none');
};

CustomRecurrenceView.prototype.showCountEndType = function() {
  $('.countWrapper', this.container).css('display', 'inline');
  $('.countError', this.container).css('display', 'block');
  $('.until', this.container).css('display', 'none');
  $('.untilError', this.container).css('display', 'none');
};

CustomRecurrenceView.prototype.showUntilEndType = function() {
  $('.countError', this.container).css('display', 'none');
  $('.countWrapper', this.container).css('display', 'none');
  $('.until', this.container).css('display', 'inline-block');
  $('.untilError', this.container).css('display', 'none');
};

 CustomRecurrenceView.prototype.renderFreq = function(freq) {
  switch(freq) {
    case 'never' :
      this.renderNeverFreq();
      break;
    case 'daily' :
      this.renderDailyFreq();
      break;
    case 'weekly' :
      this.renderWeeklyFreq();
      break;
    case 'monthly' :
      this.renderMonthlyFreq();
      break;
    case 'yearly' :
      this.renderYearlyFreq();
      break;
    default :
  }
  this.renderNextOccurrence();
  this.centerWindow();
};

CustomRecurrenceView.prototype.renderNeverFreq = function() {
  var visibleRows = ['.freqRow', '.buttonRow'];
  var hiddenRows = _.difference(this.rowSelectors, visibleRows);
  visibleRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'block');
  });
  hiddenRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'none');
  });
  $('.freq', this.container).val('');
};

CustomRecurrenceView.prototype.renderDailyFreq = function() {
  var visibleRows = ['.freqRow', '.intervalRow', '.dtStartRow', '.endRow', '.buttonRow'];
  var hiddenRows = _.difference(this.rowSelectors, visibleRows);
  visibleRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'block');
  });
  hiddenRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'none');
  });
  $('.intervalTimeUnit', this.container).text('day(s)');
};

CustomRecurrenceView.prototype.renderWeeklyFreq = function() {
  var visibleRows = ['.freqRow', '.intervalRow', '.weekDayRow', '.dtStartRow', '.endRow', '.buttonRow'];
  var hiddenRows = _.difference(this.rowSelectors, visibleRows);
  visibleRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'block');
  });
  hiddenRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'none');
  });
  $('.intervalTimeUnit', this.container).text('week(s)');
};

CustomRecurrenceView.prototype.renderMonthlyFreq = function() {
  var visibleRows = ['.freqRow', '.intervalRow', '.monthDayRow', '.dtStartRow', '.endRow', '.buttonRow'];
  var hiddenRows = _.difference(this.rowSelectors, visibleRows);
  visibleRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'block');
  });
  hiddenRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'none');
  });
  $('.intervalTimeUnit', this.container).text('month(s)');
};

CustomRecurrenceView.prototype.renderYearlyFreq = function() {
  var visibleRows = ['.freqRow', '.intervalRow', '.yearMonthRow', '.yearDayRow', '.dtStartRow', '.endRow', '.buttonRow'];
  var hiddenRows = _.difference(this.rowSelectors, visibleRows);
  visibleRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'block');
  });
  hiddenRows.forEach(function(rowSelector){
    $(rowSelector, this.container).css('display', 'none');
  });
  $('.intervalTimeUnit', this.container).text('year(s)');
};

CustomRecurrenceView.prototype.renderNextOccurrence = function() {
  var r = this.rm.getFieldsEditableByView();
  
  // Set a max count of 3
  r.count = typeof r.count !== 'undefined' && r.count <= 3 ? r.count : 3;
  
  if (!r.freq) {
    $('.nextOccurrence', this.container).html(Mustache.to_html($('#nextOccurrenceTemplate').html(), {occurrences: []}));
  }
  else {
    try {
      r = this.rm.convertToRRule(r);
      var rule = new RRule(r);
      var occurrences = rule.all() || [];
      occurrences = occurrences.map(function(dt){
        return moment(dt).format("dd MM/DD/YYYY h:mm a");
      });
      $('.nextOccurrence', this.container).html(Mustache.to_html($('#nextOccurrenceTemplate').html(), {occurrences: occurrences}));
    }
    catch(e) {
      $('.nextOccurrence', this.container).html(Mustache.to_html($('#nextOccurrenceTemplate').html(), {occurrences: []}));
    }
  }
};

CustomRecurrenceView.prototype.openWindow = function() {
  var win = this.container.data('kendoWindow');
  if(!win) {
    win = this.container.kendoWindow({
      title : 'Repeat Settings',
      modal: true,
      close: function() {amplify.publish('customRecurrenceWindowClosed');}
    })
    .data('kendoWindow');
  }
  this.savedState = this.rm.getRecurrence();
  win.center();
  win.open();
  amplify.publish('customRecurrenceWindowOpened');
};

CustomRecurrenceView.prototype.closeWindow = function() {
  this.container.data('kendoWindow').close();
  amplify.publish('customRecurrenceWindowClosed');
};

CustomRecurrenceView.prototype.centerWindow = function() {
  var win = this.container.data('kendoWindow');
  if(win) {
    win.center();
  }
};

/**
 * Load Data
 */

CustomRecurrenceView.prototype.loadData = function(r) {
  
  // freq
  if('freq' in r) {
    $('select.freq', this.container).val(r.freq);
  }
  
  // Common to all freqs
  this.loadCommonData(r);

  // Specific freq types
  switch(r.freq) {
    case undefined :
      this.weekDayPushButtons.removeAllData();
      this.monthDayPushButtons.removeAllData();
      this.yearMonthPushButtons.removeAllData();
      this.renderNeverFreq();
      break;
    case 'daily' :
      //this.weekDayPushButtons.removeAllData();
      //this.monthDayPushButtons.removeAllData();
      //this.yearMonthPushButtons.removeAllData();
      this.renderDailyFreq();
      break;
    case 'weekly' :
      //this.monthDayPushButtons.removeAllData();
      this.weekDayPushButtons.loadData(r.byDay);
      this.renderWeeklyFreq();
      break;
    case 'monthly' :
      //this.weekDayPushButtons.removeAllData();
      //this.yearMonthPushButtons.removeAllData();
      this.loadMonthlyData(r);
      this.renderMonthlyFreq();
      break;
    case 'yearly' :
      //this.weekDayPushButtons.removeAllData();
      //this.monthDayPushButtons.removeAllData();
      this.loadYearlyData(r);
      this.renderYearlyFreq();
      break;
    default :
  }
  this.renderNextOccurrence();
};

CustomRecurrenceView.prototype.loadCommonData = function(r) {
  
  // interval
  if(r.interval) {
    $('.interval', this.container).val(r.interval);
  }
  else {
    $('.interval', this.container).val('');
  }

  // dtStart
  if(r.dtStart) {
    $('input.dtStart', this.container).data('kendoDateTimePicker').value(new Date(r.dtStart));
  }
  else {
    $('input.dtStart', this.container).data('kendoDateTimePicker').value('');
  }

  // End type
  if(r.count) {
    this.showCountEndType();
    $('.endType', this.container).val('count');
    $('.count', this.container).val(r.count);
  }
  else {
    $('.count', this.container).val('');
    if(r.until) {
      this.showUntilEndType();
      $('.endType', this.container).val('until');
      $('input.until', this.container).data('kendoDateTimePicker').value(new Date(r.until));
    }
    else {
      $('input.until', this.container).data('kendoDateTimePicker').value('');
    }
  }
};

CustomRecurrenceView.prototype.loadMonthlyData = function(data) {
  data = data || {};
  var match, regex = /^(-?[1-4]?)([a-z]+)/;
  $('.freq', this.container).val('monthly');
  if(data.byMonthDay) {
    this.monthDayPushButtons.loadData(data.byMonthDay);
  }
  else if(data.bySetPos && data.byDay) {
    if(data.byDay.length == 2) {
      $('.monthDayDropDown', this.container).val('weekendday');
    }
    else if (data.byDay.length == 5) {
      $('.monthDayDropDown', this.container).val('weekday');
    }
    else {
      $('.monthDayDropDown', this.container).val('day');
    }
    $('.monthDayDropDown', this.container).css('display', 'inline');
    $('.monthDayOccurrenceNumber', this.container).val(data.bySetPos);
  }
  else if(data.byDay) {
    $('.monthDayDropDown', this.container).css('display', 'inline');
    match = data.byDay.match(regex); // '1su' means month day occurrence
    var num = match[1];
    if(num >= -1 && num <= 4) {
      $('.monthDayOccurrenceNumber', this.container).val(num);
    }
    $('.monthDayDropDown', this.container).val(match[2]);
  }
};

CustomRecurrenceView.prototype.loadYearlyData = function(data) {
  data = data || {};
  var match, regex = /^(-?[1-4]?)([a-z]+)/;
  $('.freq', this.container).val('yearly'); // In one scenario freq is stored as monthly tho it is actually yearly
  this.yearMonthPushButtons.loadData(data.byMonth);
  if(data.bySetPos && data.byDay) {
    if(data.byDay.length === 2) {
      $('.yearDayDropDown', this.container).val('weekendday');
    }
    else if (data.byDay.length === 5) {
      $('.yearDayDropDown', this.container).val('weekday');
    }
    else {
      $('.yearDayDropDown', this.container).val('day');
    }
    $('.yearDayDropDown', this.container).css('display', 'inline');
    $('.yearDayOccurrenceNumber', this.container).val(data.bySetPos);
  }
  else if(data.byDay) {
    $('.yearDayDropDown', this.container).css('display', 'inline');
    match = data.byDay.match(regex); // '1su' means year day occurrence
    var num = match[1];
    if(num >= -1 && num <= 4) {
      $('.yearDayOccurrenceNumber', this.container).val(num);
    }
    $('.yearDayDropDown', this.container).val(match[2]);
  }
  else {
    $('.yearDayOccurrenceNumber', this.container).val('');
    $('.yearDayDropDown', this.container).val('su');
    $('.yearDayDropDown', this.container).css('display', 'none');
  }
};

/**
 *   Submit form
 */

CustomRecurrenceView.prototype.getDayOccurrenceValue = function(freq, r) {
  var num = freq == 'monthly' ? $('.monthDayOccurrenceNumber', this.container).val()
                              : $('.yearDayOccurrenceNumber', this.container).val();
  if(!num) { return; }
  num = parseInt(num, 10);
  var byDay = freq == 'monthly' ? $('.monthDayDropDown', this.container).val()
                                : $('.yearDayDropDown', this.container).val();
  r.byDay = byDay;
  if (r.byDay == 'weekday') {
    r.bySetPos = num;
    r.byDay = ['mo', 'tu', 'we', 'th', 'fr'];
  }
  else if (r.byDay == 'weekendday') {
    r.bySetPos = num;
    r.byDay = ['sa', 'su'];
  }
  else if(r.byDay == 'day') {
    r.bySetPos = num;
    r.byDay = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
  }
  else if(['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].indexOf(r.byDay) > -1) {
    r.byDay = num + r.byDay;
  }
};

// Duplicate code!! Also in RecurrenceView
CustomRecurrenceView.prototype.validateDateTime = function(dt) {
  dt = dt || '';
  var regex = /^\d{1,2}(\/|-|\.| )\d{1,2}(\/|-|\.| )(\d{2}|\d{4})( \d{1,2}:\d{2} ?(AM|PM|am|pm))?$/;
  var parseFormats = [
    'MM/dd/yyyy', 'MM/d/yyyy', 'M/dd/yyyy', 'M/d/yyyy', 'MM/dd/yy', 'MM/d/yy', 'M/dd/yy', 'M/d/yy',
    'MM.dd.yyyy', 'MM.d.yyyy', 'M.dd.yyyy', 'M.d.yyyy', 'MM.dd.yy', 'MM.d.yy', 'M.dd.yy', 'M.d.yy',
    'MM-dd-yyyy', 'MM-d-yyyy', 'M-dd-yyyy', 'M-d-yyyy', 'MM-dd-yy', 'MM-d-yy', 'M-dd-yy', 'M-d-yy',
    'MM dd yyyy', 'MM d yyyy', 'M dd yyyy', 'M d yyyy', 'MM dd yy', 'MM d yy', 'M dd yy', 'M d yy',
  ];
  return (regex.test(dt) && kendo.parseDate(dt, parseFormats) !== null);
};

CustomRecurrenceView.prototype.getValues = function() {
  var r = {};
  
  var freq = $('select.freq', this.container).val();
  if(freq) {
    r.freq = freq;
  }
  switch(r.freq) {
    case undefined :
      return r;
    case 'daily' :
      break;
    case 'weekly' :
      var byDay = this.weekDayPushButtons.getSelectedData();
      if(byDay.length > 0) {
        r.byDay = byDay;
      }
      break;
    case 'monthly' :
      var type = $('.monthDayOccurrenceNumber', this.container).val();
      if(type == 'day') {
        var byMonthDay = this.monthDayPushButtons.getSelectedData();
        if(byMonthDay.length > 0) {
          r.byMonthDay = byMonthDay;
        }
      }
      else {
        this.getDayOccurrenceValue(r.freq, r);
      }
      break;
    case 'yearly' :
      this.getDayOccurrenceValue(r.freq, r);
      var byMonth = this.yearMonthPushButtons.getSelectedData();
      byMonth = byMonth.map(function(n){ return parseInt(n, 10); });
      if(byMonth.length > 0) {
        r.byMonth = byMonth;
      }
      break;
    default :
      console.error('CustomRecurrenceView.getValues() invalid freq');
  }

  var intervalInput = $('input.interval', this.container);
  if(intervalInput.is(':invalid')) {
    r.interval = 'invalid'; // Stupid hack because chrome doesn't allow access to invalid values in number type fields
  }
  else {
    var interval = intervalInput.val().trim();
    if(interval) {
      r.interval = parseInt(interval, 10);
    }
  }

  var dtStart = $('input.dtStart', this.container).val().trim();
  dtStart = this.validateDateTime(dtStart) ? new Date(dtStart).toISOString() : dtStart;
  if(dtStart) {
    r.dtStart = dtStart;
  }

  var endValue = $('select.endType', this.container).val();
  if(endValue == 'count') {
    var countInput = $('input.count', this.container);
    if(countInput.is(':invalid')) {
      r.count = 'invalid'; // Stupid hack because chrome doesn't allow access to invalid values in number type fields
    }
    else {
      var count = countInput.val().trim();
      if(count) {
        r.count = parseInt(count, 10);
      }
    }
  }
  else if(endValue == 'until') {
    var until = $('input.until', this.container).val().trim();
    until = this.validateDateTime(until) ? new Date(until).toISOString() : until;
    if(until) {
      r.until = until;
    }
  }

  return r;
};

CustomRecurrenceView.prototype.setRecurrence = function() {
  // Get Values
  var r = this.getValues();
  this.rm.setFieldsEditableByView(r);
};

CustomRecurrenceView.prototype.getPossibleRepeatProperties = function() {
  return ['freq', 'dtStart', 'interval', 'byDay', 'byMonth', 'byMonthDay', 'count', 'until'];
};

