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
		    
		    switch( data.atras ) {
		        case "reminder":
                  	if ( !Ti.App.currentUser || !Ti.App.currentUser.id ) {
				        return;
				    }
				        
				    Ti.App.Properties.setObject('_trackingEvent', { eventId: data.eventId } );
		
				    var location = require('location');
					    location.tracking(new Date().getTime(), { latitude: data.latitude, longitude: data.longitude } ); // test android device arrived
					    // location.tracking(new Date().getTime(), { latitude: 37.78583526611328, longitude: -122.40641784667969 }); // test ios simulator arrived
		            break;
		            
		        case "cross_path":
		             if (Alloy.Globals.loggedIn) {
		        		Alloy.Globals.PageManager.load({
							url:        'cross_paths',
			                isReset:    true,
			                data:       { mode: 'review', event_id: data.event_id }
						}); 
		        	} else {
			        	Ti.App.Properties.setObject('appRedirect', {
							url:        'cross_paths',
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
