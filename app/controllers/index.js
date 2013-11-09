init();

function init() {
	var WinPlugins = require('window_plugins');
	
	Alloy.Globals.toggleAI = WinPlugins.toggleAI;
	
	// initialize window manager
	
	var winManager = require('window_manager');
		
	winManager.init({
		onChange: WinPlugins.onChange
	});
	
	Alloy.Globals.WinManager = winManager;
	
	Alloy.Globals.Common.checkSession(
		function() { winManager.load('main_window'); 	},
		function() { winManager.load('analyzing'); 		}
	);
}