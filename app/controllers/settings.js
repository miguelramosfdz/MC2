var Cloud = require('ti.cloud');
	Cloud.debug = true;

init();

function init() {
  	loadNav();
}

function loadNav() {
  	var btnMenu = Ti.UI.createButton({ width: Alloy.CFG.size_31, height: Alloy.CFG.size_28, backgroundImage: '/images/nav/btn-menu.png' });
	btnMenu.addEventListener('click', function(){
		Alloy.Globals.SlidingMenu.toggleLeftDrawer();
	});
	
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
