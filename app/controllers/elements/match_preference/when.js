var timeCallback,
	target;
	
exports.init = function(fnc, top) {
	timeCallback = fnc;
	$.wrapper.top = top;
};

exports.set = function(params) {
	$.lbBusyText.text      = params.busy_weekdays['prefix'] + ':';
	$.lbBusyValue.value    = params.busy_weekdays['value'];
	setBusyTime($.lbBusyValue, params.busy_weekdays['time']);
	
	$.lbWeekendsText.text  = params.busy_weekends['prefix'] + ':';
	$.lbWeekendsValue.value = params.busy_weekends['value'];
	setBusyTime($.lbWeekendsValue, params.busy_weekends['time']);
};

function setBusyTime(label, text) {
	if (OS_IOS) {
		label.attributedString = Ti.UI.iOS.createAttributedString({
		    text: text,
		    attributes: [
		        // Underlines text
		        {
		            type: Titanium.UI.iOS.ATTRIBUTE_UNDERLINES_STYLE,
		            value: Titanium.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE,
		            range: [0, text.length]
		        }
		    ]
		});
	} else {
		label.text = text;
	}
}

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
	if ( !target ) {
		return;
	}
	
	var moment = require('alloy/moment'),
		arrTime = time.toTimeString().split(':'),
		value = arrTime[0] + arrTime[1];
		
    setBusyTime(target, moment(time).format('h:mmA'));
    target.value = value;
    target = null;
};