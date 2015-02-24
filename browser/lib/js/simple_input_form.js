var SimpleRecurrenceView = function(rm, containerSelector) {
  this.rm = rm; // recurrence model
  this.containerSelector = containerSelector;
  this.container = $(this.containerSelector);
  if(this.container.length === 0) {
    return console.error('SimpleRecurrenceView(): Unable to locate container.');
  }
  this.rv = new RecurrenceView(rm, containerSelector);
  this.repeatSettingsDropDown = null;
  this.initInputs();
  this.registerEvents();
};

SimpleRecurrenceView.prototype.initInputs = function() {
  var data = [
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
      dataSource: data,
      close: this.closeRepeatSettings.bind(this)
  });
  this.repeatSettingsDropDown = $("input.repeatSettings", this.container).data('kendoDropDownList');
  var r = rm.getFieldsEditableByView();
  if(r.freq) {
    this.repeatSettingsDropDown.value(r.freq);
  }
  else {
    
  }
};

SimpleRecurrenceView.prototype.registerEvents = function() {
  amplify.subscribe('recurrenceUpdated', this.updateValues.bind(this));
  amplify.subscribe('recurrenceError', this.showError.bind(this));
};

SimpleRecurrenceView.prototype.closeRepeatSettings = function(evt) {
  var choice = evt.sender.value();
  if(choice == 'custom') {
    return this.rv.disableInputs();
  }
  this.rv.enableInputs();
  this.setRecurrence();
  if(choice === '') {
    this.rv.showNeverEndType();
    this.rv.hideEndType();
  }
  else {
    this.rv.showEndType();
  }
};

SimpleRecurrenceView.prototype.updateValues = function(r) {
  console.log('SimpleRecurrenceView.updateValues()');
  if(r.freq) {
    this.repeatSettingsDropDown.value(r.freq);
  }
};

SimpleRecurrenceView.prototype.setRecurrence = function() {
  console.log('setRecurrence()');
  var r = this.rv.getValues();
  r.freq  = this.repeatSettingsDropDown.value();
  if(r.freq === 'custom') return;
  if(r.freq === '') {
    return r.dtStart ? this.rm.setFieldsEditableByView({dtStart: r.dtStart, repeatType: 'simple'})
                     : this.rm.setFieldsEditableByView({repeatType: 'simple'});
  }
  this.rm.setFieldsEditableByView(r);
};

SimpleRecurrenceView.prototype.showError = function(err) {
  if(err.appliesTo == 'freq') {
    this.showFreqError(err.error);
  }
};

SimpleRecurrenceView.prototype.showFreqError = function(msg) {
  $('input.repeatSettings', this.container).closest('li').find('h2').after(this.rv.wrapErrorMessage(msg, 'freqError'));
};

