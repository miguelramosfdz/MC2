var Cloud = require('ti.cloud');
	Cloud.debug = true;

exports.init = function() {
  	loadNav();
  	Alloy.Globals.toggleAI(false);
  	
  	test();
};

function test() {
	Ti.App.Properties.setObject('_trackingEvent', { eventId: '52b3fe975f54be0b820079f2' } );
		
    var location = require('location');
	    location.tracking(new Date().getTime(), { latitude: 37.78583526611328, longitude: -122.40641784667969 }); // test ios simulator arrived
}

function loadNav() {
  	var btnMenu = Alloy.createController('elements/button', {
		icon: { width: Alloy.CFG.size_16, height: Alloy.CFG.size_15, backgroundImage: '/images/nav/btn-menu.png' },
		callback: function() {
		  	Alloy.Globals.SlidingMenu.toggleLeftDrawer();
		}
	}).getView();
	
  	$.nav.init({
  		title: 'App Settings',
		left: btnMenu,
	});
}

function logout() {
	Alloy.Globals.toggleAI(true);
	
	Cloud.Users.logout(function (e) {
		Alloy.Globals.toggleAI(false);
		
	    if (e.success) {
	    	var fb = require('facebook');
				fb.logout();
	
	    	Ti.App.Properties.setObject('currentUser', false );
	    	Ti.App.currentUser = false;
	    	Alloy.Globals.loggedIn = false;
	    	
	        Alloy.Globals.WinManager.load({
	        	url: 'analyzing'
	        });
	    } else {
	        Alloy.Globals.Common.showDialog({
	        	title:		'Logout Error',
	            message:	((e.error && e.message) || JSON.stringify(e))
	        });
	    }
	});
}
