var timeCallback,
	target;
	
exports.init = function(fnc, top) {
	timeCallback = fnc;
	$.wrapper.top = top;
};

exports.set = function(params) {
	$.lbBusyText.text      = params.busy_weekdays['prefix'] + ':';
	$.lbBusyValue.value    = params.busy_weekdays['value'];
	$.lbBusyValue.text     = params.busy_weekdays['time'];
	
	$.lbWeekendsText.text  = params.busy_weekends['prefix'] + ':';
	$.lbWeekendsValue.value = params.busy_weekends['value'];
	$.lbWeekendsValue.text = params.busy_weekends['time'];
};

exports.get = function() {
	return {
		busy_weekdays: $.lbBusyValue.value,
		busy_weekends: $.lbWeekendsValue.value,
		busy_weekdays_text: $.lbBusyText.text.replace(':',''),
		busy_weekends_text: $.lbWeekendsText.text.replace(':','')
	};
};

function togglePrefix(e) {
  	var element = e.source.children[0];
  	element.text = ((element.text == 'After:') ? 'Before:' : 'After:'); 
}

function showTimePicker(e) {
	target = e.source;
  	timeCallback();
}

exports.update = function(time) {
	var moment = require('alloy/moment'),
		arrTime = time.toTimeString().split(':'),
		value = arrTime[0] + arrTime[1];
	
  	target.text = moment(time).format('h:mmA');
  	target.value = value;
  	target = null;
};