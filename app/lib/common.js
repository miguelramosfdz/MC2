var Api = require('api');

function showDialog(args) {
	if (!args.buttonNames) {
		args.buttonNames = ['OK'];
	}
	
	Ti.UI.createAlertDialog(args).show();
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

exports.checkSession = function(success, error) {
	var currentUser = Ti.App.Properties.getObject('currentUser', false );
	
	if ( !currentUser ) {
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

exports.startTrackingLocation = function (eventId, lat, lon) {
    if ( !Ti.App.currentUser || !Ti.App.currentUser.id ) {
        return;
    }
    Ti.API.error ('device starting tracking...' + lat + '...' + lon );

    var location = require('location');
        
    Ti.App.Properties.setObject('_trackingEvent', { eventId: eventId } );
        
    location.tracking(new Date().getTime(), { latitude: lat || 0, longitude: lon || 0 } ); // test android device arrived
    // location.tracking(new Date().getTime(), { latitude: 37.78583526611328, longitude: -122.40641784667969 }); // test ios simulator arrived
};

exports.trackingLocationResponse = function ( status ) {
    if ( status == 1 ) {// arrived 
    	var _trackingEvent = Ti.App.Properties.getObject('_trackingEvent', false);
    	
        if ( _trackingEvent ) {
               //get event data
            Api.getEventById ({ 
                  event_id: _trackingEvent.eventId
            },
            function (res) {
                if ( res && res.length ) {
                    var event         = res[0],
                        arrived_users = event.custom_fields.arrived_users;
                        arrived_users = ( arrived_users ) ? arrived_users.split(',') : [];
                    
                    if ( arrived_users.indexOf (Ti.App.currentUser.id) == -1 ) {
                       arrived_users.push ( Ti.App.currentUser.id );
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
        } 
    } 

    Ti.App.Properties.removeProperty('_trackingEvent');
};

exports.answerFeedback = function ( data ) {
    if ( !Ti.App.currentUser || !Ti.App.currentUser.id ) {
        return;
    }
    
    //This is response format on android: {"atras":"feed_back","android":{"sound":"default","alert":"Did you see someone you'd like to cross paths with again?"},"crossPath":{"event":{"id":"52a7d7d1bc4dc20b1500064c","start_time":"2013-12-11T03:40:51+0000"},"place":{"address":"882 N Point St","name":"Black Point Cafe"}}}
    var feedbackDialog =  Ti.UI.createAlertDialog({
        title: 			data.eventName,
        message: 		( OS_ANDROID ) ? data.android.alert : data.alert,
        buttonNames: 	['YES', 'NO'] 
    });
     
    feedbackDialog.show();
    feedbackDialog.addEventListener ('click', function (e) {
        //get event data
        if (e.index < 0) {
            feedbackDialog.show();
            return;
        }
        
        Api.getEventById ({ 
            event_id: data.eventId
        },
        function (res) {
            if ( res && res.length ) {
                var event        = res[0],
                    //new data to update
                    event_update = { 
                        event_id : event.id,
                        custom_fields: {}
                    };
          
                var _field      = ( !e.index ) ? 'feedback_yes' : 'feedback_no',// get field to update yes | no
                    _field_data = event.custom_fields[ _field ]; 
                    
                // check exist data
                _field_data = ( _field_data ) ? _field_data.split(',') : [];
    
                if ( _field_data.indexOf ( Ti.App.currentUser.id ) == -1 ) {
                    _field_data.push ( Ti.App.currentUser.id );
                }
    
                event_update.custom_fields[_field] = _field_data.join(',');
                
                //update event
                Api.updateEvent ( { data : JSON.stringify( event_update ) } );
            }
        });
    });
};

exports.getCurrentLocation = function ( callback ) {
    
    if ( Ti.Geolocation.locationServicesEnabled ) {
        Alloy.Globals.toggleAI(true);
        
        Ti.Geolocation.purpose = 'Get Current Location';
        Ti.Geolocation.getCurrentPosition(function( e ) {
            if ( e.success && e.coords ) {
                callback && callback ( e.coords );
            } else {
                Alloy.Globals.Common.showDialog({
                    title:      'Warning',
                    message:    'Sorry. We can\'t detect your current Location.',
                });
            }
            Alloy.Globals.toggleAI(false);
        });
    } else {
        Alloy.Globals.Common.showDialog({
            title:      'Warning',
            message:    'Location service on your device is turned off. Can\'t detect your current Location.',
        });
    }
};