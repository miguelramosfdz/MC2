// Require in the module
var CloudPush = require('ti.cloudpush');

exports.init = function() {
	if ( '' == Ti.App.Properties.getString('deviceToken', '') ) {
		retrieveDeviceToken();
	} else {
		CloudPush.enabled = true;
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
	CloudPush.enabled = true;
	Ti.App.Properties.setString('deviceToken', e.deviceToken);
}

function deviceTokenError(e) {
	alert('Failed to register for push notifications! ' + e.error);
}

function registerCallbacks() {
	// Process incoming push notifications
	CloudPush.addEventListener('callback', function(evt) {
		if ( evt && evt.payload ) {
		    var data = JSON.parse ( evt.payload );
		    
		    switch( data.atras ) {
		        case "reminder":
	                  Alloy.Globals.Common.startTrackingLocation( data.eventId, data.latitude, data.longitude );
		              break;
		        case "cross_path":
		             if (Alloy.Globals.loggedIn) {
		        		Alloy.Globals.PageManager.load({
							url:        'cross_paths_preview',
			                isReset:    true,
			                data:       { mode: 'review', event_id: data.event_id }
						}); 
		        	} else {
			        	Ti.App.Properties.setObject('appRedirect', {
							url:        'cross_paths_preview',
			                isReset:    true,
			                data:       { mode: 'review', event_id: data.event_id }
						});
					}
		       		break;
		        case "feedback":
		             Alloy.Globals.Common.answerFeedback( data );
                     break;
		      }
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
