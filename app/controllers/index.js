init();

function init() {
	var plugins = require('managers/plugins');
	
	Alloy.Globals.toggleAI = plugins.toggleAI;
	
	// initialize window manager
	
	var oWindowManager = require('managers/window'),
		winManager = new oWindowManager( plugins.windowChanged );
	
	Alloy.Globals.WinManager = winManager;
	
	Alloy.Globals.Common.checkSession(
		function() { 
			if ( Ti.App.currentUser.photo ) {
				winManager.load({
					url: 'main_window'
				});	
			} else {
				winManager.load({
					url: 'analyzing'
				});
			}
		},
		function() { 
			winManager.load({
				url: 'analyzing'
			}); 		
		}
	);
}