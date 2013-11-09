var Cloud = require('ti.cloud'),
	fb = require('facebook');
	currentUser = {},
	vars = {};

Cloud.debug = true;

init();

exports.unload = function() {
	if (vars) {
		var movie = vars.loadingMovie;
		movie.removeEventListener('complete', playMovie);
		movie.hide();
		movie.stop();
		movie.release();
		vars = null;
	}
};

function init() {
	getCurrentCity();
}

function analyze(e) {
	var fbButton = e.source;
		fbButton.hide();
	
	fb.appid = 661033647260420;
	fb.permissions = ['email', 'user_birthday'];
	fb.forceDialogAuth = true;
	
	fb.addEventListener('login', function(e) {
	  	if (e.success) {
	  		Ti.API.info('Log in FB - success');
	  		
	        loadMovie();
	        fbProcessData ( ( OS_IOS ) ? e.data : JSON.parse(e.data) ); //e.data is string on android
	        
	    } else if (e.error) {
	    	fbButton.show();
	    	
	    	if ( e.cancelled ) {
	    		Alloy.Globals.Common.showDialog({
		            title:		'Facebook Error',
		            message:	e.error,
		         });
	    	} else {
	    		// Something wrong with Facebook
		        Alloy.Globals.Common.showDialog({
		            title:		'Facebook Error',
		            message:	e.error
		        });
	    	}
	    }
	});	
	
	if ( fb.loggedIn ) {
		fb.requestWithGraphPath('me', {}, 'GET', function(e) {
			if (e.success) {
				Ti.API.info('FB request fb.me - success');
				
				loadMovie();
		        fbProcessData ( JSON.parse(e.result));
		        
		    } else if (e.error) {
		    	fbButton.show();
		    	
		    	Alloy.Globals.Common.showDialog({
		            title:	'Facebook Error',
		            message: e.error,
		    	});
		    } else {
		    	fbButton.show();
		    	
		        Alloy.Globals.Common.showDialog({
		            title:	'Facebook Error',
		            message: 'Unknown Error',
		        });
		    }
		});
	} else {
		fb.authorize();
	}
}

function fbProcessData ( fbInfo ) {
	Ti.API.info('Login to FB success: ' + JSON.stringify(fbInfo));
	
    // prepares data for new User
    currentUser = {
    	username: 	fbInfo.username,
    	email:		fbInfo.email,
    	last_name: 	fbInfo.last_name,
    	first_name: fbInfo.first_name,
    	custom_fields: {
			name: 			fbInfo.name,
			gender: 		fbInfo.gender ? Alloy.Globals.Common.capitalize(fbInfo.gender) : 'Anyone',
			age: 			19,
			locale: 		fbInfo.en_US,
			status: 		'pending',
			coordinates: 	vars.userCoordinates,
			city: 			vars.userCity || ''
    	},
    	fbID:		fbInfo.id
    };
    
	if ( fbInfo.birthday ) {
		currentUser['custom_fields']['age'] = new Date().getFullYear() - parseInt( fbInfo.birthday.split('/')[2], 10);
	}
	
	loginWithFacebook ( fbInfo.id );
}

function loginWithFacebook( fbID ) {
	Cloud.SocialIntegrations.externalAccountLogin(
		{
		    type: 'facebook',
		    token: fb.getAccessToken(),
		    id:	fbID
		}, 
		function (e) {
		    if (e.success) {
		       	var user = e.users[0];
		       	Ti.API.info ( 'externalAccountLogin: ' + JSON.stringify(e) );
				Ti.API.info ( 'Cloud.sessionId: ' + Cloud.sessionId );
				
				if ( user.photo ) {
					Ti.App.currentUser = user;
					Alloy.Globals.Common.cacheUser();
					vars.finishLoading = 1;
				} else {
					vars.finishLoading = 2;
				}
				
		    } else {
		    	Alloy.Globals.Common.showDialog({
		            title:		'Facebook Login Error',
		            message:	((e.error && e.message) || JSON.stringify(e))
	         	});
		    }
		}
	);
}

function loadMovie() {
	vars.finishLoading = false;
	
	var movie = Ti.Media.createVideoPlayer({
		autoplay: 			true,
		// fullscreen: 		true,
		// top: 			0,
		// height: 			platformHeight,
		mediaControlStyle: 	Ti.Media.VIDEO_CONTROL_NONE,
		scalingMode: 		Ti.Media.VIDEO_SCALING_ASPECT_FIT,
		sourceType: 		Ti.Media.VIDEO_SOURCE_TYPE_FILE,
		url: 				'/videos/analyzing.mp4'
	});
	movie.addEventListener('complete', playMovie);
	vars.loadingMovie = movie;
	$.win.add(movie);
}

function playMovie(e) {
	if (vars.finishLoading === false) {
		vars.loadingMovie.play();
	} else {
		if (vars.finishLoading === 1) {
			Alloy.Globals.WinManager.load('main_window');
		} else {
			Alloy.Globals.WinManager.load('analyze_result', currentUser);
		}
	}
}

function getCurrentCity() {
  	if ( Ti.Geolocation.locationServicesEnabled ) {
		Ti.Geolocation.purpose = 'Get Current City';
	    Ti.Geolocation.getCurrentPosition(function( e ) {
	    	if ( e.success ) {
	    		vars.userCoordinates = [e.coords.longitude, e.coords.latitude];
	    		
		        Ti.Geolocation.reverseGeocoder( e.coords.latitude, e.coords.longitude, function( rgeo ) {
		        	Ti.API.info(JSON.stringify(rgeo));
					if ( rgeo.success ) {
						rgeo.places[0].state = rgeo.places[0].address.split(', ')[5];
						vars.userCity = rgeo.places[0].city;
					}
				});
			} else {
				Alloy.Globals.Common.showDialog({
		            title:		'Warning',
		            message:	'Sorry. We can\'t detect your current City.',
		     	});
			}
	    });
	} else {
		Alloy.Globals.Common.showDialog({
            title:		'Warning',
            message:	'Location service on your device is turned off. Can\'t detect your current City.',
     	});
	}
}