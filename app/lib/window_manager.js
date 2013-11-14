var Alloy = require('alloy');

/*
 onChange: function(status, params){
	 status =
	 - 0: start load
	 - 1: loading
	 - 2: load finish
	 - 3: window close
	 
	 return false to cancel default behavior
 }
 * */
function WindowManager(onChange) {
	var UIManager;
	
	(onChange == null) && (onChange = function() {});
	
	init();
		
	// PRIVATE FUNCTIONS ========================================================
	
	function init() {
		var oUIManager = require('ui_manager');
		UIManager = new oUIManager(UIChange);
		
		//
		
		Ti.API.log('Window Manager: initialized');
	}

	function UIChange(status, params, win) {
	  	if (onChange(status, params, win) === false) { return false; }
	  	
	  	var oSwitch = {
			0: winBeforeLoad,
			1: winLoaded,
			2: winDestroy
		};
		return oSwitch[status](params, win);
	}

	function winBeforeLoad(params) {}
	
	function winLoaded(params, win) {
		// make window visible
		win.open();
		
		// handle back event
		OS_ANDROID && win.addEventListener('androidback', androidback);
	}
	
	function winDestroy(params, win) {
		// hide window
		win.close();
		
		Ti.API.log('Window Manager: Cached window: ' + getCache().length);
	}

	/*
	 params ={
		url: '',			// the url of the window
		data: {},			// data for that window
		isReset : true		// remove previous windows or not, default is true
	 }
	 * */
	function load(params) {
		Ti.API.log('Window Manager: Load window ' + params.url + ': ' + JSON.stringify(params.data));
		
		UIManager.set(params);

		Ti.API.log('Window Manager: Cached window: ' + getCache().length);
	};

	/*
	 params:
	 - data: new data for current win
	 - count: number of previous wins will be removed
	 * */
	function loadPrevious(data, count) {
		UIManager.setPrevious(data, count);
	};

	function getCache(index) {
		return UIManager.get(index);
	}

	/*
	 exit app
	 * */
	function exit() {
		UIManager.reset();

		// force exit app on Android
		if (OS_ANDROID) {
			var activity = Ti.Android.currentActivity;
			activity && activity.finish();
		}

		Ti.API.log('Window Manager: Exit!');
	}
	
	function androidback(e) {
		var controller = getCache(-1).controller;
		if (controller.androidback && controller.androidback() === false) {
			return;
		}
	
		if (getCache().length > 1) {
			loadPrevious();
		} else {
			var dialog = Ti.UI.createAlertDialog({
				cancel : 0,
				buttonNames : ['NO', 'YES'],
				message : 'Are you sure?',
				title : 'Quit?'
			});
			dialog.addEventListener('click', function(e) {
				if (e.index !== e.source.cancel) {
					exit();
				}
			});
			dialog.show();
		}
	}
	
	// PUBLIC FUNCTIONS ========================================================
	
	return {
		load: load,
		loadPrevious: loadPrevious,
		getCache: getCache,
		exit: exit
	};
};

module.exports = WindowManager;