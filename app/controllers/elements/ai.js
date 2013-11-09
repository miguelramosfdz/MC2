var aiTimeout,
	args = arguments[0] || {};

if (args.visible) {
	$.loadingSpinner.show();
	$.ai.show();
}

exports.toggle = function(visible, message, timeout) {
	if (aiTimeout) {
		clearTimeout(aiTimeout);
		aiTimeout = null;
	}
	
	if (visible) {
		$.loadingMessage.text = message || 'Loading...';
		
		$.loadingSpinner.show();
		$.ai.show();
		
		if (timeout) {
			aiTimeout = setTimeout(function(){
				Ti.UI.createAlertDialog({
					buttonNames : ['OK'],
					message : 'Activity timeout',
					title : 'Error'
				}).show(); 
			}, timeout);
		}
	} else {
		$.loadingSpinner.hide();
		$.ai.hide();
	}
};

exports.unload = function() {
  	if (aiTimeout) {
		clearTimeout(aiTimeout);
		aiTimeout = null;
	}
};