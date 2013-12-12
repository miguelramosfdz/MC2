exports.init = function(params) {
	Alloy.Globals.loggedIn = true;
	
	loadHomepage( arguments[0] || {} );
};

exports.cleanup = function() {
	
};

exports.reload = function( params ) {
	Alloy.Globals.SlidingMenu = $.menu;
};

exports.unload = function() {
	Alloy.Globals.SlidingMenu = null;
};

exports.androidback = function() {
	var cache = Alloy.Globals.PageManager.getCache(),
		current = cache[cache.length - 1].controller;
	
	if (current.androidback && current.androidback() === false) {
		return false;
	}
	
	
	if (cache.length > 1) {
		Alloy.Globals.PageManager.loadPrevious();
		return false;
	}
};

function loadHomepage( args ) {
	// page container
	
	var container = Ti.UI.createView({  });
	
	var oPageManager = require('page_manager');
		pageManager = new oPageManager(),
		defaultPage = 'someone_like',
		defaultPageData = null;
  	
  	var appRedirect = Ti.App.Properties.getObject('appRedirect');
  	if (appRedirect) {
  		defaultPage = appRedirect.url;
  		defaultPageData = appRedirect.data;
  		Ti.App.Properties.removeProperty('appRedirect');
  	}
  	
	pageManager.init({
		onChange: onChange,
		container: container,
		defaultPage: defaultPage,
		defaultPageData: defaultPageData
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
	}
}