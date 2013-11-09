
loadHomepage( arguments[0] || {} );

exports.cleanup = function() {
	
};

exports.reload = function( params ) {
	Alloy.Globals.SlidingMenu = $.menu;
};

exports.unload = function() {
	Alloy.Globals.SlidingMenu = null;
};

function loadHomepage( args ) {
	// page container
	
	var container = Ti.UI.createView({  });
	
	var pageManager = require('page_manager');
  	
	pageManager.init({
		container: container,
		onChange: onChange,
		defaultPage: 'someone_like'
	});
		
	Alloy.Globals.PageManager = pageManager;
	
	// initialize menu
	
	var leftMenu = Alloy.createController('elements/leftmenu');
	
	// initialize sliding menu - version 09/04/13 - https://github.com/MadRocket/com.madrocket.ti.slidemenu
	
	$.menu.init({
	  	leftDrawer: leftMenu.getView(),
	  	content: container
	});
	
	var menuView = $.menu.getView();
	menuView.addEventListener('open:[left]', function(e){
	  	$.slideMenuCover.left = Alloy.CFG.size_275;
	  	$.slideMenuCover.visible = true;
	});
	menuView.addEventListener('close:[left]', function(e) {
	  	$.slideMenuCover.visible = false;
	});
	
	Alloy.Globals.SlidingMenu = $.menu;
	
	// Alloy.Globals.SlidingMenu.toggleLeftDrawer();
	// Alloy.Globals.SlidingMenu.toggleRightDrawer();
}

function hideSlideMenu(e) {
  	Alloy.Globals.SlidingMenu.toggleLeftDrawer();
}

function onChange(status, data) {
	if (status == 0) {
		Alloy.Globals.toggleAI(true);
	} else if (status == 2) {
		Alloy.Globals.toggleAI(false);
	}
}