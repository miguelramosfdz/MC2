var callback;

exports.show = function(fnc) {
	callback = fnc;
	
	if (OS_IOS) {
		$.container.show();
	} else {
		Ti.UI.createPicker().showTimePickerDialog({ callback: setTime, okButtonTitle: 'Set', title: 'Select Time' });
	}
};

function hidePicker(e) {
  	if (OS_IOS) {
		$.container.hide();
	} else {
		
	}
}

exports.hide = hidePicker;

function setTime(e) {
	// TODO: this function fire 2 time on android
	callback( e.value || $.timePicker.value );
}