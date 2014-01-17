// Require in the module
var CloudPush = require('ti.cloudpush');

exports.init = function() {
	if ( '' == Ti.App.Properties.getString('deviceToken', '') ) {
		retrieveDeviceToken();
	} else {
		enableCloudPush();
	}

	registerCallbacks();
};

function retrieveDeviceToken() {
	// Initialize the module
	CloudPush.retrieveDeviceToken({
		success : deviceTokenSuccess,
        error : deviceTokenError
	});
}

// Enable push notifications for this device
// Save the device token for subsequent API calls
function deviceTokenSuccess(e) {
	enableCloudPush();
	Ti.App.Properties.setString('deviceToken', e.deviceToken);
}

function deviceTokenError(e) {
	alert('Failed to register for push notifications! ' + e.error);
}

function enableCloudPush () {
    CloudPush.enabled = true; // Whether or not this device will receive push notifications.
    CloudPush.showTrayNotificationsWhenFocused = true;// Whether or not to show tray notifications when your application is in the foreground.
}

function registerCallbacks() {
	// Process incoming push notifications
	CloudPush.addEventListener('callback', function(evt) {
		if ( evt && evt.payload ) {
		    var data = JSON.parse ( evt.payload );
		    
		    Alloy.Globals.Common.pushNotificationCallback( data );
        }
	});
	// Triggered when the push notifications is in the tray when the app is not running
	// CloudPush.addEventListener('trayClickLaunchedApp', function(evt) {
		// Ti.API.error('Tray Click Launched App (app was not running):' + '\n\t' + JSON.stringify(evt));
	// });
	// // Triggered when the push notifications is in the tray when the app is running
	// CloudPush.addEventListener('trayClickFocusedApp', function(evt) {
		// Ti.API.error('Tray Click Focused App (app was already running):' + '\n\t' + JSON.stringify(evt));
	// });
}
