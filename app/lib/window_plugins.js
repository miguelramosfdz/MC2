var Alloy = require('alloy');

exports.onChange = function(status, params, win) {
	var oSwitch = {
		0: winBeforeLoad,
		1: winLoaded,
		2: winDestroy
	};
	return oSwitch[status](params, win);
};

function winBeforeLoad(params) {
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

function winLoaded(params, win) {
	var controller = params.controller;
	
	// attach AI
	
  	var ai = Alloy.createController('elements/ai', { visible: false });
	win.add( ai.getView() );
	params.ai = ai;
	
	// attach hidden textfield for hiding keyboard
	
	var hiddenTextfield = Ti.UI.createTextField({ visible: false });
	win.add(hiddenTextfield);
	params.hiddenTextfield = hiddenTextfield;
}

function winDestroy(params, win) {
	params.ai.unload();
  	params.ai = null;
  	params.hiddenTextfield = null;
}

function windowClosed(e) {
  	Alloy.Globals.WinManager.getCache(-1).isOpened = false;
  	Alloy.Globals.WinManager.loadPrevious();
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