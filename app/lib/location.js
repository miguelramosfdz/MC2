var locationTime,
	locationTimeExpired = 60 * 60 * 1000, // 1 hour
	locationDestination,
	backgroundServices,
	geo = require('geo');

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
	
	Ti.Geolocation.addEventListener('location', locationCallback);
	
	if (OS_IOS) {
		Ti.App.addEventListener('pause', appPause);
		Ti.App.addEventListener('resumed', appResume);
	} else {
		var activity = Ti.Android.currentActivity;
		activity.addEventListener('pause', appPause);
		activity.addEventListener('resume', appResume);
	}
};

function appPause() {
	Ti.API.error('appPause');
	registerService();
	
	// Geo location event still fired even when app paused
	Ti.Geolocation.removeEventListener('location', locationCallback);
}

function appResume() {
	Ti.API.error('appResume');
	
	if ( Ti.App.Properties.getBool('locationResponseFromBackground', false) ) { // Location response from the background. Stop tracking, everything...
		finishTracking();
		Ti.App.Properties.removeProperty('locationResponseFromBackground');
	} else {
		removeService();	
		
		Ti.Geolocation.addEventListener('location', locationCallback);
	}
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

function registerService(e) {
	var interval = 3 * 60 * 1000;// 3mins
	
	Ti.App.Properties.setDouble('locationTime', locationTime);
	Ti.App.Properties.setInt('locationTimeExpired', locationTimeExpired);
	Ti.App.Properties.setObject('locationDestination', locationDestination);
	
	if (OS_IOS) {
		Ti.App.Properties.setInt('interval', interval);
		backgroundServices = Ti.App.iOS.registerBackgroundService({ url: 'location_service_ios.js' });
	} else {
		var intent = Ti.Android.createServiceIntent({ url: 'location_service_android.js' });
		intent.putExtra('interval', interval);
		
		backgroundServices = Ti.Android.createService(intent);
		backgroundServices.start(); 
	}
}

function removeService(e) {
	if (backgroundServices) {
		if (OS_IOS) {
			backgroundServices.stop();
			backgroundServices.unregister();
			Ti.App.Properties.removeProperty('interval');
		} else {
			var intent = backgroundServices.getIntent();
			if ( Ti.Android.isServiceRunning(intent) ) {
				backgroundServices.stop();
			}
		}
		backgroundServices = null;
		
		Ti.App.Properties.removeProperty('locationTime');
		Ti.App.Properties.removeProperty('locationTimeExpired');
		Ti.App.Properties.removeProperty('locationDestination');
	}
}

function locationCallback(e) {
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
}

function finishTracking() {
  	Ti.Geolocation.removeEventListener('location', locationCallback);
  	
  	removeService();
  	
  	if (OS_IOS) {
		Ti.App.removeEventListener('pause', appPause);
		Ti.App.removeEventListener('resumed', appResume);
	} else {
		var activity = Ti.Android.currentActivity;
		activity.removeEventListener('pause', appPause);
		activity.removeEventListener('resume', appResume);
	}
  	
  	locationDestination = null;
  	locationTime = null;
}

function showMessage(message) {
	Ti.UI.createAlertDialog({
		title: 'Meetcute',
		message: message
	}).show();
}

function locationResult(status) {
  	finishTracking();
  	
  	//Ti.API.error ('location result___' + (status == 1) ? 'Meetcute: Arrived' : 'Meetcute: Timeout');
  	Alloy.Globals.Common.trackingLocationResponse ( status );
}

exports.locationResult = locationResult;