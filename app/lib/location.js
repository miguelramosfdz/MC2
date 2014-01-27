var locationTime,
	locationTimeExpired = 60 * 60 * 1000, // 1 hour
	locationDestination,
	backgroundServices,
	lastUpdated,
	geo   = require('geo'),
	Common = require('common');
	
	/// FIX IOS7
    	var OS_IOS7 = false,
    		ios7Interval,
    		geoLocationEventListeners = 0;
	/// FIX IOS7	
	
exports.tracking = function(time, dest) {
	Ti.API.error( '[Location Module] - tracking...' );
	
    checkPermission();
    
	locationTime = time;
	locationDestination = dest;
	
	if (OS_IOS) {
		
		/// Check if IOS7
		var version = Ti.Platform.version.split("."),
			major   = parseInt(version[0], 10);
		
		OS_IOS7 = (major >= 7);
		/// Check if IOS7
		
	    iosTrack();
	    
	    if ( OS_IOS7 ) {
	    	ios7Interval = setInterval(iosTrack , 10000);
	    }
		
  	} else { // OS_ANDROID 
  		Ti.Geolocation.preferredProvider = "gps";
  		Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
  		
  		Ti.Geolocation.addEventListener('location', trackingCallback);
  	}
  	
	//remove the location event when app closed 
    Ti.App.addEventListener( 'location:stopTracking', finishTracking);
};

function iosTrack() {
	Ti.API.error( '[Location Module] - track...'  );
	
	if ( OS_IOS7 ) { // FIX IOS7
		
		if ( geoLocationEventListeners > 0 ) {
			Ti.Geolocation.removeEventListener('location', trackingCallback);	
			geoLocationEventListeners--;
		}
		
		Ti.Geolocation.distanceFilter = 0;
	} else {
		Ti.Geolocation.distanceFilter = 10;
	}
	
	Ti.Geolocation.purpose = "Get user location";
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
	Ti.Geolocation.addEventListener('location', trackingCallback);
	geoLocationEventListeners++;
}

function checkPermission() {
  	if (Ti.Geolocation.locationServicesEnabled === false) {
		showMessage('Please turn on Location services');
		return;
	}

	if (OS_IOS) {
		var authorization = Ti.Geolocation.locationServicesAuthorization;
		if (authorization == Ti.Geolocation.AUTHORIZATION_DENIED) {
			showMessage('You have disallowed Meetcute from running geolocation services.');
		} else if (authorization == Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
			showMessage('Your system has disallowed Meetcute from running geolocation services.');
		}
	}
}

function trackingCallback(e) {
	Ti.API.error( '[Location Module] - trackingCallback...' );
	
	var message = '';
	
	if (!e.success || e.error) {
		message = 'error_' + e.code;
		Ti.API.log( 'Location tracking error: ' + message );
	}

	if ( !message && geo.inRange(e.coords, locationDestination)) {
		locationResult(1);
	} else if (new Date().getTime() - locationTime > locationTimeExpired) {
		locationResult(2);
	}
	
	if ( e.success ) {// 2 mins
		
		if ( !lastUpdated || (new Date().getTime() - lastUpdated) >= (2 * 60 *1000) ) {
			var coords = e.coords;
	        
		    lastUpdated = new Date().getTime();
		    Common.trackingLocationResponse ( 3, coords.latitude + '_' + coords.longitude + '_' + coords.timestamp );// update last location
		}
	}
}

function finishTracking() {
	Ti.API.error( '[Location Module] - finishTracking...' );
	
  	Ti.Geolocation.removeEventListener('location', trackingCallback);
  	geoLocationEventListeners = 0;
  	
  	if ( ios7Interval ) {
  		clearInterval(ios7Interval);
  		ios7Interval = null;
  	}
  	
  	locationDestination = null;
  	locationTime = null;
  	lastUpdated = null;
}

function showMessage(message) {
	if ( OS_IOS ) {
        Ti.App.iOS.scheduleLocalNotification({ // TODO: Test me on background
            alertBody: 	message,
            date:		new Date(new Date().getTime() + 1000) // 1 second after unregister
        }); 
	} else {
		Ti.UI.createAlertDialog({
			title: 'Meetcute',
			message: message
		}).show();
	}
}

function locationResult(status) {
  	finishTracking();
  	Common.trackingLocationResponse ( status );
}

exports.locationResult = locationResult;