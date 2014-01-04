var Alloy = require('alloy'),
	useNav = false,
	navigation;

if (useNav) {
	loadNavigationLib();
	exports.updateNav = navigation.update;
}

/* =============================================================================
   start Window plugins
   ========================================================================== */

exports.windowChanged = function(status, params, win) {
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
  		toggleAI(true);
  	}
}

function winLoaded(params, win) {
	var controller = params.controller;
	
	if (useNav && controller.nav) {
		navigation.load(params, controller, win, 'window');
		
		if (OS_IOS) {
			if (params.isReset !== false) {
				var navigationWindow = Ti.UI.iOS.createNavigationWindow({ window: win });
				params.navigationWindow = navigationWindow;
				navigationWindow.open();
			} else {
				// cleanup cache, in case of window is closed, by clicked on the default Back button
				win.addEventListener('close', windowClosed);
				
				var navigationWindow = getNavigationWindow();
				navigationWindow.openWindow(win);
			}
			
			params.isOpened = true;
			
			return false; // do not open this window, because we have already opened it here
		}
	} else {
		win.navBarHidden = true;
	}
	
	win.addEventListener('open', win.isTabgroup != true ? windowOpened : tabgroupOpened);
}

function winDestroy(params, win) {
  	var controller = params.controller;
  	
	if (useNav && OS_IOS && controller.nav) {
		if (params.isReset !== false) {
			params.navigationWindow.close();
		} else {
			win.removeEventListener('close', windowClosed);
			
			if (params.isOpened !== false) {
				var navigationWindow = getNavigationWindow();
				navigationWindow.closeWindow(win);
			}
		}
		
		params.isOpened = false;
		
		return false; // do not close this window, because we have already closed it here
	}
}

function windowOpened(e) {
	e.source.removeEventListener('open', windowOpened);
	
	toggleAI(true);
	
	var params = Alloy.Globals.WinManager.getCache(-1),
		init = params.controller.init;
	init && init(params); //TODO: remove this condition
}

function windowClosed(e) {
	var winManager = Alloy.Globals.WinManager;
  	winManager.getCache(-1).isOpened = false;
  	winManager.loadPrevious();
}

function getNavigationWindow() {
	var navigationWindow,
  		cache = Alloy.Globals.WinManager.getCache();
  		
	for (var i = cache.length - 1; i >= 0; i--){
	  	if (navigationWindow = cache[i].navigationWindow) {
	  		break;
	  	}
	};
	
	return navigationWindow;
}

/* =============================================================================
   end Window plugins
   ========================================================================== */



/* =============================================================================
   start Tabgroup plugins
   ========================================================================== */

/*
 params = {
 	title: '',
 	controller: exports,
 	tabgroup: Ti.UI.TabGroup
 }
 * */
exports.updateTabGroupNav = function(isEnabled, params) {
	if (isEnabled) {
		if (OS_ANDROID) {
			params.controller.nav = {
				title: params.title
			};
		}
		params.tabgroup.isTabgroup = true;
	} else {
		params.tabgroup.navBarHidden = true;
	}
};

exports.tabGroupChanged = function(status, params, win) {
	if (status == 0) {
		var tabgroup = Alloy.Globals.Tabgroup;
		if (tabgroup && tabgroup.getCache(tabgroup.getActiveTab()).length > 1) {
			toggleAI(true);
		}
	} else if (status == 1) {
		var controller = params.controller;
		if (controller.nav) {
			navigation.load(params, controller, win, 'tabgroupWindow');
		} else {
			win.navBarHidden = true;
		}
		
		var tabgroup = Alloy.Globals.Tabgroup;
		if (tabgroup && tabgroup.getCache(tabgroup.getActiveTab()).length > 1) {
			win.addEventListener('open', tabgroupOpened);
		}
	}
};

exports.tabGroupFocussed = function(currentIndex, previousIndex, tabgroup) {
	// update actionbar buttons
	if (OS_ANDROID) {
		var tabgroupController = Alloy.Globals.WinManager.getCache(-1).controller,
			currentTab = Alloy.Globals.Tabgroup.getCache(currentIndex, -1).controller;
		tabgroupController.nav = currentTab.nav;
		tabgroup.activity.invalidateOptionsMenu();
	}
};

function tabgroupOpened(e) {
	Ti.API.error('tabgroupOpened');
	
	e.source.removeEventListener('open', tabgroupOpened);
	
	toggleAI(true);
	
	var tabgroup = Alloy.Globals.Tabgroup,
		params = tabgroup.getCache(tabgroup.getActiveTab(), -1);
	
	if (params.isInit != true) {
		var init = params.controller.init;
		init && init(params); //TODO: remove this condition
		
		params.isInit = true;
	}
}

/* =============================================================================
   end Tabgroup plugins
   ========================================================================== */



/* =============================================================================
   start Navigation
   ========================================================================== */

function loadNavigationLib() {
	if (OS_IOS) {
		navigation = require('managers/nav/ios'); // use NavigationWindow for iOS
	} else {
		if (Ti.Platform.Android.API_LEVEL >= 14) {
			navigation = require('managers/nav/android_new'); // use ActionBar for android 4.0 and up
		} else {
			navigation = require('managers/nav/android_old'); // custom nav for android below 4
		}
	}
}

/* =============================================================================
   end Navigation
   ========================================================================== */
 

/* =============================================================================
   start Activity Indicator
   ========================================================================== */
  
var _AIs = [],
	_AI_Timeout;

function loadAI(message, timeout) {
  	var ai = Ti.UI.createWindow({ navBarHidden: true });
		
		if (OS_IOS) {
			ai.applyProperties({ backgroundColor: '#80000000' });
		} else {
			ai.applyProperties({ modal: true });
		}
		
		var dialog = Ti.UI.createView({ width: Ti.UI.SIZE, height: Ti.UI.SIZE, borderRadius: 10, backgroundColor: '#000', layout: 'vertical' });
			
			var activityIndicator = Ti.UI.createActivityIndicator({ color: '#fff', width: Ti.UI.SIZE, height: Ti.UI.SIZE, top: '17dp', style: OS_IOS ? Ti.UI.iPhone.ActivityIndicatorStyle.BIG: Ti.UI.ActivityIndicatorStyle.BIG });
			activityIndicator.show();
			dialog.add(activityIndicator);
			
			dialog.add( Ti.UI.createLabel({ text: message || 'Loading ...', width: Ti.UI.SIZE, height: Ti.UI.SIZE, top: '10dp', bottom: '17dp', left: '20dp', right: '20dp', color: '#fff', textAlign: 'center', font: { fontSize: '15dp', fontWeight: 'bold' } }) );
		
		ai.add(dialog);
	
	timeout && setTimeout(toggleAI, timeout);
	
	ai.addEventListener('open', AIOpened);
	OS_ANDROID && ai.addEventListener('androidback', AIBack);
	
	return ai;		
}

function AIBack(e) { return; }
function AIOpened(e) { e.source.isOpened = true; }

function toggleAI(visible, message, timeout) {
	if (visible) {
		_AI_Timeout && clearTimeout(_AI_Timeout);
		
		var ai = loadAI();
		ai.open();
		
		_AIs.push(ai);
		
	} else {
		var ii = _AIs.length;
		if (ii) {
			if (_AIs[ii - 1].isOpened) {
				for(var i=ii-1; i>=0; i--){
					_AIs[i].close();
			  	};
			  	_AIs.length = 0;
			} else {
				_AI_Timeout = setTimeout(toggleAI, 500);
			}
		}
	}
};
exports.toggleAI = toggleAI;

/* =============================================================================
   end Activity Indicator
   ========================================================================== */