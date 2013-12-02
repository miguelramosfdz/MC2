exports.init = function() {
	if ( '' == Ti.App.Properties.getString('deviceToken', '') ) {
		retrieveDeviceToken();	
	}
};

function retrieveDeviceToken() {
	Ti.Network.registerForPushNotifications({
	    // Specifies which notifications to receive
	    types: [
	        Ti.Network.NOTIFICATION_TYPE_BADGE,
	        Ti.Network.NOTIFICATION_TYPE_ALERT,
	        Ti.Network.NOTIFICATION_TYPE_SOUND
	    ],
	    success: deviceTokenSuccess,
	    error: deviceTokenError,
	    callback: receivePush
	});

}

// Save the device token for subsequent API calls
function deviceTokenSuccess(e) {
    Ti.App.Properties.setString('deviceToken', e.deviceToken);
}

function deviceTokenError(e) {
    alert('Failed to register for push notifications! ' + e.error);
}

// Process incoming push notifications
function receivePush(e) {
    alert('Received push: ' + JSON.stringify(e));
}