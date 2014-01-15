var locationTime,
	locationTimeExpired = 60 * 60 * 1000, // 1 hour
	locationDestination,
	backgroundServices,
	lastUpdated = new Date().getTime(),
	geo 		= require('geo');

exports.tracking = function(time, dest) {
    checkPermission();
    
	locationTime = time;
	locationDestination = dest;
	
	if (OS_IOS) {
  		Ti.Geolocation.distanceFilter = 10;
		Ti.Geolocation.purpose = "Get user location";
  	}
  	
  	Ti.Geolocation.preferredProvider = "gps";
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
	
	Ti.Geolocation.addEventListener('location', trackingCallback);
	
	//remove the location event when app closed 
    Ti.App.addEventListener( 'location:stopTracking', finishTracking);
};

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
	Ti.API.error('locationCallback - foreground');
	
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
	
	if ( e.success && lastUpdated && (new Date().getTime() - lastUpdated) >= (3 * 60 *1000) ) {// 3 mins
	    var coords = e.coords;
	    
	    lastUpdated = new Date().getTime();
	    Alloy.Globals.Common.trackingLocationResponse ( 3, coords.latitude + '_' + coords.longitude + '_' + coords.timestamp );// update last location
	}
}

function finishTracking() {
  	Ti.Geolocation.removeEventListener('location', trackingCallback);
  	
  	locationDestination = null;
  	locationTime = null;
  	lastUpdated = 0;
}

function showMessage(message) {
	Ti.UI.createAlertDialog({
		title: 'Meetcute',
		message: message
	}).show();
}

function locationResult(status) {
  	finishTracking();
  	Alloy.Globals.Common.trackingLocationResponse ( status );
}

exports.locationResult = locationResult;