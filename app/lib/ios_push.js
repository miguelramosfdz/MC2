exports.init = function() {
	retrieveDeviceToken();	
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
	// {"code":0,"data":{"alert":"Someone liked you too! Next time you are nearby MeetCute will help you cross paths.","atras":"someone_like","sound":"default","aps":{"sound":"default","alert":"Someone liked you too! Next time you are nearby MeetCute will help you cross paths."}},"type":"remote","source":{},"inBackground":true,"success":true}
	// {"code":0,"data":{"sound":"default","arrived_users":"","atras":"reminder","aps":{"sound":"default","alert":"Just a reminder, 30 mins until Cross path with a match for you at "},"alert":"Just a reminder, 30 mins until Cross path with a match for you at ","longitude":0,"latitude":0,"eventId":"52a04448b55c570b1c02be6a"},"type":"remote","source":{},"inBackground":false,"success":true}
    Ti.API.info('Received push:\n\t' + JSON.stringify(e));
    
	var data = e.data;
		    
    switch( data.atras ) {
		case 'reminder':
            if ( !Ti.App.currentUser || !Ti.App.currentUser.id ) {
		        return;
		    }
		    
		    Ti.App.Properties.setObject('_trackingEvent', { eventId: data.eventId } );

		    var location = require('location');
			    location.tracking(new Date().getTime(), { latitude: data.latitude, longitude: data.longitude } ); // test android device arrived
			    // location.tracking(new Date().getTime(), { latitude: 37.78583526611328, longitude: -122.40641784667969 }); // test ios simulator arrived
            break;
            
		case 'cross_path':
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
		case 'feedback':
			if (Alloy.Globals.loggedIn) {
				Alloy.Globals.Common.answerFeedback( data );
					
			} else {				
				// This action will be handled in someone_like
				Ti.App.Properties.setObject('onLoggedIn', { action: 'answerFeedback', data: data }); 
			}
		    break;
    }
}