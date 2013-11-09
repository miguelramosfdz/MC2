var Alloy = require('alloy'),
	UIManager,
	mainWindowLoaded = false,
	onChange;

/*
 args = {
 	onChange: function(status, params){
 		status = 
		  - 0: start load
		  - 1: loading
		  - 2: load finish
		  - 3: window close
 	}
 }
 * */
function init(args) {
	onChange = args.onChange || function() {};
  	
  	var oUIManager = require('ui_manager');
  	UIManager = new oUIManager({
		onLoad: UILoad,
		onDestroy: UIDestroy
	});
  	
  	Ti.API.log('Window Manager: initialized');
};

/*
 params = {
 	controller: exports, 
 	data: {}, 
 	isReset: false,
 	url: ''
 }
 
 controller may have the following functions
  - cleanup: called when window loose focus
  - reload: called when window focus again
  - unload: called when window closed
  - androidback: back event for android
 * */
function UILoad(params) {
	onChange(1, params); 

	// make window visible
	var win = params.controller.getView();
	win.open();
	
	// handle back event
	if (OS_ANDROID) {
		registerBackEvent(win);
	}
}

/*
 params = {
 	controller: exports,
 	url: ''
 }
 * */
function UIDestroy(params) {
	onChange(3, params);
	
  	params.controller.getView().close();
}

/*
 params:
  - url: the url of the window
  - data: data for that window
  - isReset: remove previous windows or not, default is true
 * */
function load(url, data, isReset){
	Ti.API.log('Window Manager: Load window ' + url + ': ' + JSON.stringify( data ));
	
	var params = {
		url: url,
		data: data,
		isReset: isReset
	};
	
	onChange(0, params);
	
	if (mainWindowLoaded) {
		// main window, if exists, is alway be the first item in cache
		
		if (url != 'main_window') {
			params.isReset = false;
			UIManager.set(params);
			
			// remove previous window, except the first (main win : index 0) and the last window (new win : index -1)
			if (isReset != false) {
				UIManager.remove(-2, 1);
			}
		} else {
			// reload main window
			UIManager.get(0).controller.reload(data);
			
			// remove previous window, except the first window
			UIManager.remove(null, 1);
		}
	} else {
		if (url == 'main_window') {
			mainWindowLoaded = true;
		}
		
		UIManager.set(params);
	}
	
	onChange(2, params);
	
	Ti.API.log('Window Manager: Cached window: ' + UIManager.get().length);
};

/*
 params: 
  - data: new data for current win
  - count: number of previous wins will be removed
 * */
function loadPrevious(data, count) {
	UIManager.setPrevious(data, count);
	
	Ti.API.log('Window Manager: Cached window: ' + UIManager.get().length);
};

function getCache(index) {
  	return UIManager.get(index); 
}

function registerBackEvent(win) {
	win.addEventListener('androidback', function(e) {
		if ( Ti.App.F_KeyboardShowing ) {
			// Default - Will hide keyboard
		} else {
			var current = UIManager.get(-1);
			if (current.controller.androidback) {
				var result = current.controller.androidback();
				if (result === false) {
					return;
				}
			}
			
			if (UIManager.get().length > 1) {
				loadPrevious();
			} else {
				var dialog = Ti.UI.createAlertDialog({ cancel : 0, buttonNames : ['NO', 'YES'], message : 'Are you sure?', title : 'Quit?' });
				dialog.addEventListener('click', function(e) {
					if ( e.index !== e.source.cancel ) {
						var activity = Ti.Android.currentActivity;
						activity.finish();
					}
				});
				dialog.show();
			}
		}
	});
}

/*
 if an URL is offered, load that window and reset cache
 if not, reset cache, if android, close application
 * */
function reset(url, data) {
	// exit app
	if (url != null) {
		load(url, data, false);
		
		// remove all window except the last window : index -1
		UIManager.remove(-2, 0);
	} else {
		UIManager.reset();
		
		if (OS_ANDROID) {
			var activity = Ti.Android.currentActivity;
			activity && activity.finish();
		}
	}
  	
  	mainWindowLoaded = false;
  	
  	Ti.API.log('Window Manager: Reset! Cached window: ' + UIManager.get().length);
}

//

exports.init = init;
exports.getCache = getCache;
exports.loadPrevious = loadPrevious;
exports.load = load;
exports.reset = reset;