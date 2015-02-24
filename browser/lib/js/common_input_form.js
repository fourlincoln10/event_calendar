var RecurrenceView = function(rm, containerSelector, multiInstanceBaseDoc) {
  this.rm = rm; // recurrence model
  this.containerSelector = containerSelector;
  this.container = $(this.containerSelector);
  if(this.container.length === 0) {
    return console.error('RecurrenceView(): Unable to locate container.');
  }
  this.dtStartPicker = null;
  this.countInput = null;
  this.untilPicker = null;
  this.endTypeSelect = null;
  this.repeatSettingsDropDown = null;
  this.initInputs();
  this.setInitialValues();
  this.registerEvents();
};

RecurrenceView.prototype.initInputs = function(multiInstanceBaseDoc) {
  var parseFormats = [
    'MM/dd/yyyy', 'MM/d/yyyy', 'M/dd/yyyy', 'M/d/yyyy', 'MM/dd/yy', 'MM/d/yy', 'M/dd/yy', 'M/d/yy',
    'MM.dd.yyyy', 'MM.d.yyyy', 'M.dd.yyyy', 'M.d.yyyy', 'MM.dd.yy', 'MM.d.yy', 'M.dd.yy', 'M.d.yy',
    'MM-dd-yyyy', 'MM-d-yyyy', 'M-dd-yyyy', 'M-d-yyyy', 'MM-dd-yy', 'MM-d-yy', 'M-dd-yy', 'M-d-yy',
    'MM dd yyyy', 'MM d yyyy', 'M dd yyyy', 'M d yyyy', 'MM dd yy', 'MM d yy', 'M dd yy', 'M d yy',
  ];
  $('input.dtStart', this.container).kendoDateTimePicker({
    value : '',
    format: "MM/dd/yyyy h:mm tt",
    parseFormats: parseFormats
  });
  $('input.until', this.container).kendoDateTimePicker({
    value : '',
    format: "MM/dd/yyyy h:mm tt",
    parseFormats: parseFormats
  });
  var repeatChoices = [
    { text: "Never", value: "" },
    { text: "Every Day", value: "daily" },
    { text: "Every Week", value: "weekly" },
    { text: "Every Month", value: "monthly" },
    { text: "Every Year", value: "yearly" },
    { text: "Custom", value: "custom" }
  ];
  $("input.repeatSettings", this.container).kendoDropDownList({
    dataTextField: "text",
    dataValueField: "value",
    dataSource: repeatChoices
  });
  this.repeatSettingsDropDown = $("input.repeatSettings", this.container).data('kendoDropDownList');
  var r = rm.getFieldsEditableByView();
  if(r.freq) {
    this.repeatSettingsDropDown.value(r.freq);
  }
  this.dtStartPicker = $('input.dtStart', this.container).data('kendoDateTimePicker');
  this.countInput = $('input.count', this.container);
  this.untilPicker = $('input.until', this.container).data('kendoDateTimePicker');
  this.endTypeSelect = $('.endType', this.container);
};

RecurrenceView.prototype.setInitialValues = function() {
  var r = this.rm.getFieldsEditableByView();
  this.updateValues(r);
};

RecurrenceView.prototype.registerEvents = function() {
  $(document).off('change', this.containerSelector + ' .endType').on('change', this.containerSelector + ' .endType', this.changeEndType.bind(this));
  $(document).off('blur', this.containerSelector + ' input.until').on('blur', this.containerSelector + ' input.until', this.setRecurrence.bind(this));
  $(document).off('blur', this.containerSelector + ' input.dtStart').on('blur', this.containerSelector + ' input.dtStart', this.setRecurrence.bind(this));
  $(document).off('blur', this.containerSelector + ' input.count').on('blur', this.containerSelector + ' input.count', this.setRecurrence.bind(this));
  this.repeatSettingsDropDown.bind('close', this.closeRepeatSettings.bind(this));
  $(this.repeatSettingsDropDown.element).closest('.k-dropdown').closest('.k-dropdown.k-widget').keyup(this.closeRepeatSettings.bind(this));
  amplify.subscribe('recurrenceUpdated', this.updateValues.bind(this));
  amplify.subscribe('customRecurrenceWindowClosed', this.closeCustomWindow.bind(this));
};

RecurrenceView.prototype.changeEndType = function(evt) {
  this.setRecurrence();
  var endType = this.endTypeSelect.val();
  if(endType === '') {
    this.showNeverEndType();
  }
  else if(endType == 'count') {
    this.showCountEndType();
  }
  else if(endType == 'until') {
    this.showUntilEndType();
  }
};

RecurrenceView.prototype.closeRepeatSettings = function(evt) {
  var choice = this.repeatSettingsDropDown.value();
  if(choice == 'custom') {
    this.disableInputs();
    return amplify.publish('customRepeatSelected');
  }
  this.enableInputs();
  this.setRecurrence();
  return choice === '' ? this.hideEndType() : this.showEndType();
};

RecurrenceView.prototype.closeCustomWindow = function() {
  if(!this.isCustomRepeatType()) {
    this.enableInputs();
    var choice = this.repeatSettingsDropDown.value();
    return choice === '' ? this.hideEndType() : this.showEndType();
  }
};

RecurrenceView.prototype.disableInputs = function() {
  this.dtStartPicker.enable(false);
  this.endTypeSelect.attr('disabled', true);
  this.countInput.attr('disabled', true);
  this.untilPicker.enable(false);
};

RecurrenceView.prototype.enableInputs = function() {
  if(!this.multiInstanceBaseDoc) {
    this.dtStartPicker.enable(true);
  }
  this.endTypeSelect.removeAttr('disabled');
  this.countInput.removeAttr('disabled');
  this.untilPicker.enable(true);
};

RecurrenceView.prototype.showEndType = function() {
  $('.endType', this.container).closest('li').css('display', 'block');
};

RecurrenceView.prototype.hideEndType = function() {
  $('.endType', this.container).closest('li').css('display', 'none');
};

RecurrenceView.prototype.showNeverEndType = function() {
  $('.endType', this.container).val('');
  $('.countWrapper, .until', this.container).css('display', 'none');
};

RecurrenceView.prototype.showCountEndType = function() {
  $('.endType', this.container).closest('li').css('display', 'block');
  $('.endType', this.container).val('count');
  $('.countWrapper', this.container).css('display', 'inline');
  $('.until', this.container).css('display', 'none');
};

RecurrenceView.prototype.showUntilEndType = function() {
  $('.endType', this.container).closest('li').css('display', 'block');
  $('.endType', this.container).val('until');
  $('.countWrapper', this.container).css('display', 'none');
  $('.until', this.container).css('display', 'inline-block');
};

RecurrenceView.prototype.isCustomRepeatType = function() {
  var r = this.rm.getFieldsEditableByView();
  var customFields = ['interval','byDay','byMonthDay','byMonth','bySetPos'];
  var fieldsInRecurrence = Object.keys(r);
  return _.intersection(customFields, fieldsInRecurrence).length > 0 ? true : false;
};

RecurrenceView.prototype.updateValues = function(r) {
  var d = r.dtStart ? new Date(r.dtStart) : '';
  this.dtStartPicker.value(d);
  if(this.isCustomRepeatType()) {
    this.repeatSettingsDropDown.value('custom');
    this.disableInputs();
    return this.hideEndType();
  }

  var f = r.freq ? r.freq : '';
  this.repeatSettingsDropDown.value(f);
  if(f === '') {
    this.hideEndType();
  }
  if(r.count) {
    this.countInput.val(r.count);
    this.showCountEndType();
  }
  else {
    this.countInput.val('');
    if (r.until) {
      this.untilPicker.value(new Date(r.until));
      this.showUntilEndType();
    }
    else {
      this.untilPicker.value('');
    }
  }
};

RecurrenceView.prototype.validateDateTime = function(dt) {
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

RecurrenceView.prototype.getValues = function() {
  var dtStart = this.dtStartPicker.element.val().trim();
      dtStart = this.validateDateTime(dtStart) ? new Date(dtStart).toISOString() : dtStart;
  var freq    = this.repeatSettingsDropDown.value();
  var endType = this.endTypeSelect.val();
  var count   = parseInt(this.countInput.val().trim(),10);
  var until   = this.untilPicker.element.val().trim();
      until   = this.validateDateTime(until) ? new Date(until).toISOString() : until;
  var r = {};
  if(dtStart) {
    r.dtStart = dtStart;
  }
  if(freq) {
    r.freq = freq;
  }
  if(endType == 'count' && count) {
    r.count = count;
  }
  else if (endType === 'until' && until) {
    r.until = until;
  }
  return r;
};

RecurrenceView.prototype.setRecurrence = function () {
  var r = this.getValues();
  this.rm.setFieldsEditableByView(r);
};

