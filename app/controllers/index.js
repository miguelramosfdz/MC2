init();

function init() {
	var WinPlugins = require('window_plugins');
	
	Alloy.Globals.toggleAI = WinPlugins.toggleAI;
	
	// initialize window manager
	
	var oWindowManager = require('window_manager'),
		winManager = new oWindowManager( WinPlugins.onChange );
	
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