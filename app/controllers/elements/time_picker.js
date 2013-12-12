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
	if (OS_IOS) {
		callback( $.timePicker.value );
	} else {
	    //TODO: callback is called double.
		if (e.cancel === false) {
			callback( e.value );
		}
	}
}