var Api = require('api');

function showDialog(args) {
	if (!args.buttonNames) {
		args.buttonNames = ['OK'];
	}
	
	var dialog = Ti.UI.createAlertDialog(args);
	
	dialog.show();
	return dialog; 
}
exports.showDialog = showDialog;

exports.checkInternet = function() {
	if ( !Ti.Network.online ) {
		showDialog({
	        title	: 'Network Error',
	        message	: 'No internet connection.'
	    });
	    
	    return false;
	}
	
	return true;
};

exports.cacheUser = function() {
	var Cloud = require('ti.cloud'),
		currentUser = Ti.App.currentUser;
	
	// http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Cloud-property-sessionId
	currentUser['session'] 		= Cloud.sessionId;
	currentUser['lastLogined'] 	= new Date().getTime();
	
	Ti.App.Properties.setObject('currentUser', currentUser);
};

function getCurrentUser() {
	return Ti.App.Properties.getObject('currentUser', {});
}

exports.checkSession = function(success, error) {
	var currentUser = Ti.App.Properties.getObject('currentUser', false );
	
	if ( !currentUser || !currentUser.external_accounts ) {
		error();
		return;
	}
	
	var external_account = currentUser.external_accounts[0],
		Cloud = require('ti.cloud');
		Cloud.debug = true;
	
	Cloud.SocialIntegrations.externalAccountLogin(
		{
		    type: 	external_account.external_type,
		    token: 	external_account.token,
		    id:		external_account.external_id
		}, 
		function (e) {
		    if (e.success) {
				Ti.App.currentUser = e.users[0];
				Alloy.Globals.Common.cacheUser();
				success();
				
		    } else {
		    	Alloy.Globals.Common.showDialog({
		            title:		'Facebook Login Error',
		            message:	((e.error && e.message) || JSON.stringify(e))
	         	});
	         	
	         	Ti.App.Properties.setObject('currentUser', false );
	         	error();
		    }
		}
	);
};

exports.formatBusyTime = function ( status, strTime ) {
	var prefixNum = ( status.toLowerCase() == 'before' ) ? 1 : 2,
		result = 0;
	
	if ( strTime.length == 4 ) {
		result = parseInt( prefixNum + strTime, 10 );
	}

	return result;
}; 

exports.capitalize = function (s) {
	if ( !s ) {
		return '';
	}
	
    return s.charAt(0).toUpperCase() + s.slice(1);
};

/*
 @return default value of busy time  ([before 06:69, after: 22:59])
 * 10659 default value format: 1 => Before, 0659 => 06:59AM
 * 22259 default value format: 2 => After, 2259 => 22:59PM
 * */
exports.busyTime = function() {
    return [ 10659, 22259 ];
};

exports.reverseToBusyString = function  ( time ) {
    var result = {},
        moment = require('alloy/moment');
    
    time = time.toString();
    if ( time && time.length == 5 ) {
        var temp        = time.slice(1),
            realTime    = [ temp.slice(0, 2), temp.slice(2) ],
            _date       = moment();
    
        _date.hour( parseInt ( realTime[0], 10 ) );
        _date.minute( parseInt ( realTime[1], 10 ) ); 
    
        result = {
            prefix: ( time.charAt(0) == 2 ) ? 'After' : 'Before',
            time:   _date.format('h:mmA'),
            value:  realTime.join('')
        };
    }
    
    return result;
};

exports.trackingLocationResponse = function ( status, location ) {
    var _trackingEvent = Ti.App.Properties.getObject('_trackingEvent', false);
    
    if ( _trackingEvent ) {
        if ( status == 1 ) {// arrived 
            //get event data
            Api.getEventById ({ 
                  event_id: _trackingEvent.eventId
            },
            function (res) {
                if ( res && res.length ) {
                    var event         = res[0],
                        arrived_users = event.custom_fields.arrived_users,
                        currentUserId = getCurrentUser().id;
                        
                    arrived_users = ( arrived_users ) ? arrived_users.split(',') : [];
                    
                    if ( arrived_users.indexOf( currentUserId ) == -1 ) {
                       arrived_users.push( currentUserId );
                    }
                    
                    var event_data = { 
                        event_id : event.id,
                        custom_fields: {
                            arrived_users: arrived_users.join(',')  
                        }
                    };
                    Api.updateEvent ( { data : JSON.stringify( event_data ) } );
                }
            });
            Ti.App.Properties.removeProperty('_trackingEvent');
        } else if ( status == 3 ) { // update agree_users_locations
            //get event data
            Api.getEventById ({ 
                  event_id: _trackingEvent.eventId
            },
            function (res) {
                if ( res && res.length ) {
                    var event           = res[0],
                        users_locations = event.custom_fields.users_locations;
                        users_locations = ( users_locations ) ? JSON.parse(users_locations) : {};
                    
                    users_locations[Ti.App.currentUser.id] = location;
                    
                    var event_data = { 
                        event_id : event.id,
                        custom_fields: {
                            users_locations: JSON.stringify(users_locations)
                        }
                    };

                    Api.updateEvent ( { data : JSON.stringify( event_data ) } );
                }
            });
        } else {
            Ti.App.Properties.removeProperty('_trackingEvent');
        }
    }
};

function answerFeedback ( data, message ) {
    //This is response format on android: {"atras":"feed_back","android":{"sound":"default","alert":"Did you see someone you'd like to cross paths with again?"},"crossPath":{"event":{"id":"52a7d7d1bc4dc20b1500064c","start_time":"2013-12-11T03:40:51+0000"},"place":{"address":"882 N Point St","name":"Black Point Cafe"}}}
    var feedbackDialog =  Ti.UI.createAlertDialog({
        title: 			data.name,
        message: 		message,
        buttonNames: 	['YES', 'NO'] 
    });
     
    feedbackDialog.show();
    feedbackDialog.addEventListener ('click', function (e) {
        //get event data
        if (e.index < 0) {
            feedbackDialog.show();
            return;
        }
        
        getEventById ( data.id, function (event) {
            if (!event) {
                return;
            }
                    //new data to update
            var event_update = { 
                event_id : event.id,
                custom_fields: {}
            };
          
            var _field      = ( !e.index ) ? 'feedback_yes' : 'feedback_no',// get field to update yes | no
                _field_data = event.custom_fields[ _field ]; 
                    
            // check exist data
            _field_data = ( _field_data ) ? _field_data.split(',') : [];
            
            var currentUserId = getCurrentUser().id;

            if ( _field_data.indexOf ( currentUserId ) == -1 ) {
                _field_data.push ( currentUserId );
            }

            event_update.custom_fields[_field] = _field_data.join(',');
            
            //update event
            Api.updateEvent ( { data : JSON.stringify( event_update ) } );
        });
    });
};

exports.answerFeedback = answerFeedback;

function getEventById ( event_id, callback ) {
    Api.getEventById ({ 
        event_id: event_id
    },
    function (res) {
        if ( res && res.length ) {
            callback && callback( res[0]);
        }
    });
}

exports.getCurrentLocation = function ( callback ) {

    if ( !checkGeoPermission() ) {
        Ti.Geolocation.accuracy          = Ti.Geolocation.ACCURACY_HIGH;
        Ti.Geolocation.preferredProvider = "gps";
        
        if ( OS_IOS ) {
  			Ti.Geolocation.distanceFilter = 10;
			Ti.Geolocation.purpose = "Get user location";
  		}

        Ti.Geolocation.addEventListener('location', locationCallback);
    }
};

exports.removeLocationEvent = function  () {
    Ti.Geolocation.removeEventListener('location', locationCallback);
};

function locationCallback ( e ) {
    if (!e.success || e.error) {
        Ti.API.log( 'Location tracking error: ' + JSON.stringify(e.error) );
        return;
    }
    
    if ( e.coords ) {
        Ti.App.Properties.setObject('last_location', { timestamp: e.coords.timestamp, latitude: e.coords.latitude, longitude: e.coords.longitude });
    }
}

function checkGeoPermission() {
    var error = '';
    
    if (Ti.Geolocation.locationServicesEnabled === false) {
        error = 'Please turn on Location services';
    }

    if (OS_IOS) {
        var authorization = Ti.Geolocation.locationServicesAuthorization;
       
        if (authorization == Ti.Geolocation.AUTHORIZATION_DENIED) {
            error = 'You have disallowed Meetcute from running geolocation services.';
        } else if (authorization == Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
            error = 'Your system has disallowed Meetcute from running geolocation services.';
        }
    }
    
    if ( error ) {
        showDialog({ title:'Location Services', message: error });
    }
    
    return error;
}

exports.age = function(dob) {
	var now = new Date(),
		dob = dob.split('/'),
		m	= parseInt(dob[0], 10),
		y 	= now.getFullYear() - parseInt(dob[2], 10);
		
	return (now.getMonth() + 1 >= m) ? y : y - 1;
};

function pushNotificationCallback ( data ) {
    if (!data) {
        return;
    }
    
    switch( data.atras ) {
    	
    case "reminder":
    
        if ( getCurrentUser().id ) {
        	getEventById (data.eventId, function(event) {
	            if (event) {
	                var location  = require('location'),
	                    latitude  = ( event.place['latitude'] ) ? parseFloat ( event.place['latitude']) : 0,
	                    longitude = ( event.place['longitude'] ) ? parseFloat ( event.place['longitude']) : 0;
	                 
	                Ti.App.Properties.setObject('_trackingEvent', { eventId: data.eventId } );    
	                location.tracking(new Date().getTime(), { latitude: latitude, longitude: longitude } );
	            }
	        });
        } else {
        	Ti.App.Properties.setObject('appRedirect', {
                url:        'someone_like',
                isReset:    true,
                data:       { mode: 'reminder', event_id: data.eventId }
            });
        }
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
    	if ( getCurrentUser().id ) {
            getEventById (data.eventId, function (event) {
	            if (event) {
	                answerFeedback(event, ( OS_ANDROID ) ? data.android.alert : data.alert);
	            }
	        }); 
        } else {
            Ti.App.Properties.setObject('appRedirect', {
                url:        'someone_like',
                isReset:    true,
                data:       { mode: 'feedback', event_id: data.eventId, alert: ( OS_ANDROID ) ? data.android.alert : data.alert }
            });
        }
        break;
    }
}

exports.pushNotificationCallback = pushNotificationCallback;
