var Alloy = require('alloy');

exports.onChange = function(status, params) {
	var oSwitch = {
		0: onLoad,
		2: onLoadFinish,
		3: onClose
	};
	var fnc = oSwitch[status];
	fnc && fnc(params);
};

function onLoad(params) {
  	var current = Alloy.Globals.WinManager.getCache(-1);
  	
  	// first load, current is null
  	if (current) {
  		// hide AI before load new window
  		current.ai.toggle(false);
  		
  		// hide keyboard
	  	var txt = current.hiddenTextfield;
	  	txt.focus();
	  	txt.blur();
  	}
}

function onLoadFinish(params) {
	var current = Alloy.Globals.WinManager.getCache(-1), // at this point, current is not null
  		win = current.controller.getView();
	
	// attach AI
	
  	var ai = Alloy.createController('elements/ai');
	win.add( ai.getView() );
	current.ai = ai;
	
	// attach hidden textfield for hiding keyboard
	
	var hiddenTextfield = Ti.UI.createTextField({ visible: false });
	win.add(hiddenTextfield);
	current.hiddenTextfield = hiddenTextfield;
}

function onClose(params) {
  	params.ai.unload();
  	params.ai = null;
  	params.hiddenTextfield = null;
}

exports.toggleAI = function(visible, message, timeout) {
	if (visible) {
		// show the AI of current window only
		var current = Alloy.Globals.WinManager.getCache(-1);
		current && current.ai.toggle(true, message, timeout);
	} else {
		// hide the AI of all window
		var cache = Alloy.Globals.WinManager.getCache();
		for (var i = cache.length - 1; i >= 0; i--){
			var con = cache[i];
		  	con.ai.toggle(false);
		};
	}
};