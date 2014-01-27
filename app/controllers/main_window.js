exports.init = function(params) {
	Alloy.Globals.loggedIn = true;
	
	loadHomepage( arguments[0] || {} );
	
	// Push Notification
	var pushObj = ( OS_ANDROID ? require('and_push') : require('ios_push') );
		pushObj.init();
		
	Ti.App.addEventListener('resumed', appResumed);	
};

function appResumed() {
	if ( false == Ti.App.Properties.getBool('has_active_cross_path', false ) ) {
		return;
	}
	
	var userId = Ti.App.Properties.getObject('currentUser', {}).id;
    
    if ( !userId ) {
    	return;
    }
    
    var Api 	= require('api'),
		moment  = require('alloy/moment');
    
    Api.checkCrossPath( 
        userId,
        function ( res ) {
        	if ( !res.has_active_cross_path ) {
	        	Ti.App.Properties.setBool('has_active_cross_path', false );
        		return;
        	}
        	
            var trackingEvent = res.crossPath, 
            	duration = moment( trackingEvent.event['start_time'] ).diff( moment() );
		    	duration = Math.abs(duration);
		    
		    Ti.API.error('CP: ' + trackingEvent.event['start_time'] + ' - ' + duration);
		    
		    if ( trackingEvent.place['status'] == 'whitelist' && duration <= 30 * 60 * 1000 ) {
		    	
		    	Ti.API.error( 'Location Tracking Triggered...' );
		    	    
		        var location  = require('location'),
		            latitude  = trackingEvent.place['latitude'],
		            longitude = trackingEvent.place['longitude'];
		    
		    	Ti.App.Properties.setBool('has_active_cross_path', false );
		    	Ti.App.Properties.setObject('_trackingEvent', { eventId: trackingEvent.eventId } );
		        location.tracking(new Date().getTime(), { latitude: latitude, longitude: longitude } );
		    }
        },
        function ( res ) {
            Ti.API.error ( 'checkCrossPath error: ' + JSON.stringify(res));
        }
    );
}

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
	
	var oPageManager = require('managers/page');
		pageManager = new oPageManager(),
		defaultPage = 'someone_like',
		defaultPageData = null;
  	
  	Alloy.Globals.PageManager = pageManager;
  	
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