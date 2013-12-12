/*
crossPath['place'] = {
	yelpId:     		business.id,
	name:      	 		business.name,
	website:    		business.url,
	mobile_url: 		business.mobile_url,
	image_url:  		business.image_url,
	phone_number:      	business.phone,
	address:    		business.location.address,
	categories: 		business.categories,
	display_address:   	business.location.display_address,
	city:       		business.location.city
	latitude:			.
	longitude:			.
}
crossPath['event'] = {
   start_time:			.
}

mode:
 - new: creator review
 - old: event running
 - review: matcher review
*/

var vars = arguments[0],
	Api = require('api');

vars.time = 60; // 60 seconds
vars.timer = null;
vars.createOnExit = vars.mode != 'old';

exports.init = function() {
  	loadNav();
  	loadCrossPath();
  	Alloy.Globals.toggleAI(false);
};

exports.unload = function() {
	clearTimeout(vars.timer);

	if (vars.createOnExit) {
		if (vars.mode == 'new') {
			createCrossPath(true);
		}
	}
};

/*
exports.androidback = function() {
	if (vars.time == 0) {
		var dialog = Ti.UI.createAlertDialog({
			cancel : 0,
			buttonNames : ['NO', 'YES'],
			message : 'Are you sure?',
			title : 'Quit?'
		});
		dialog.addEventListener('click', function(e) {
			if (e.index !== e.source.cancel) {
				Alloy.Globals.WinManager.exit();
			}
		});
		dialog.show();
		return false;
	}
};
*/

function loadNav() {
	var btnMenu = Alloy.createController('elements/button', {
		icon: { width: Alloy.CFG.size_16, height: Alloy.CFG.size_15, backgroundImage: '/images/nav/btn-menu.png' },
		callback: function() {
		  	Alloy.Globals.SlidingMenu.toggleLeftDrawer();
		}
	}).getView();
	
  	$.nav.init({
  		title: 'Cross paths',
		left: btnMenu
	});
}

function loadCrossPath() {
	var crossPath = vars.crossPath;
    // if ( !crossPath.place && !crossPath.event ) {
        // return;
    // }
    
    var moment      = require('alloy/moment'),
        _duration   = ( moment( crossPath.event['start_time'] ).diff( moment() ) ),
        _hours      = moment.duration(_duration).hours();
        _minutes    = moment.duration(_duration - ( _hours * 3600 ) ).minutes();
        _seconds    = moment.duration(_duration - ( ( _hours * 3600 ) +  ( _minutes * 60 ) ) ).seconds();
     
    $.lblName.text    = crossPath.place['name'];
    $.lblAddress.text = crossPath.place['address'][0] ? '(' + crossPath.place['address'][0] + ')' : '';
    $.lblTime.text    = moment( crossPath.event['start_time'] ).format('h:mmA');

    $.lblCountdown.text = ( ( _hours > 0 ) ? _hours: 0) + ' hrs ' + ( ( _minutes > 0 ) ? _minutes: 0) + ' mins ' + ( ( _seconds > 0 ) ? _seconds: 0 ) + ' secs ';

    switch ( vars.mode ) {
        case 'review':
            $.lblNotification.parent.remove( $.lblNotification );
            break;
        case 'old':
            loadWingman();
            break;
        case 'new':
            //start count down
            updateTime();
            break;
    }
}

function loadWingman() {
  	$.btnBack.parent.remove( $.btnBack );
    $.lblNotification.parent.remove( $.lblNotification );
    $.btnWingman.show();
}

function updateTime() {
	var time = vars.time;

  	vars.timer = setInterval( function() {
        time--;
        if ( time >= 0 ) {
            $.lblNotification.text = '*notifications will be sent in ' + time + ' second' + ( time > 1 ? 's' : '' );
        } else {
            // Create Place & Event on the server
        	createCrossPath();
        	vars.createOnExit = false;

            clearInterval( vars.timer );
            vars.timer = null;
            
            loadWingman();
        }
    }, 1000 );
}

function isActivePage() {
  	if (Alloy.Globals.PageManager.getCache(-1).url == 'cross_paths_preview') {
  		return true;
  	}
  	return false;
}

function createCrossPath (noCallback) {
    if ( !noCallback ) {
        Alloy.Globals.toggleAI(true);
    }
    
    // prepares event information to stores on server
    resolveAddressToCoords( vars.crossPath['place']['address'][0] , searchFacebookFriends);
}

// find the Place's coordinate by Place Address
function resolveAddressToCoords (address, callback) {
    //Ti.API.error ('resolve coords__');
    Ti.Geolocation.forwardGeocoder( address, function (e) {
        var _latitude = _longitude = 0;
        
        if ( e.success ) {
            _latitude = e.latitude || 0;
            _longitude = e.longitude || 0;
        }
        
        var crossPath = vars.crossPath;
        crossPath['place']['latitude'] = _latitude;
        crossPath['place']['longitude'] = _longitude;
        
        callback();
    } );
}

function searchFacebookFriends() {
    Api.searchFacebookFriends(
        //on success
        function(users) {
            var userIDS = [];
            for (var i = 0; i < users.length; i++) {
                userIDS.push( users[i].id );
            }

            filterMatchers(userIDS);
        },
        //on error
        function() {
            filterMatchers([]);
        }
    );
}

function filterMatchers(userIDS) {
    Api.filterMatchers(
        vars.crossPath['event'].start_time,
        userIDS, 
        filterSuccess,
        filterError
    );
}

function filterError(e) {
	if ( isActivePage() ) {
		Alloy.Globals.Common.showDialog({
	    	title:  	'Sorry',
	        message:    'Error occured, please try again.'
	    });
	    
	    Alloy.Globals.toggleAI(false);
	}
}

function filterSuccess(users) {
    var userIds     = [];

    for ( var i = 0, len = users.length; i < len; i++ ) {
    	var user = users[i];
    		userIds.push( user.id );
    }
    
    var index = _.random( userIds.length - 1 ) ;
    
    //add more information into crossPath[event] object
    var crossPath = vars.crossPath;

    crossPath['event']['matched_users']  = userIds.join(',');//userIds.slice(0, index).join(','); 
    
    // does not show alert response if the user leave this screen
    Api.crossPath( 
    	{ 
    		place: JSON.stringify( crossPath.place ), 
    		event: JSON.stringify( crossPath.event ) 
    	},
    	function ( res ) {  
    	    if ( isActivePage() ) {
    	    	// vars.crossPath = null;
    	    	vars.createOnExit = false;
    	    	
	    	    if ( res.error ) {
	    	        Alloy.Globals.Common.showDialog({
	                    title:      res.title ? res.title : 'Error',
	                    message:    res.error,
	                });
	    	    }
	    	    
	    	    Alloy.Globals.toggleAI(false);
    	    }
    	}
    );
}

function goBack(e) {
	var dialog = Ti.UI.createAlertDialog({
		buttonNames: ['No', 'Yes'],
		cancel: 0,
		message: '￼Are you sure you want to cancel this place & time?￼'
	});
	dialog.show();
	dialog.addEventListener('click', function(e) {
	  	if (e.index == 1) {
	  	    // vars.crossPath = null; // null when cancel & back to cross back
	  	    vars.createOnExit = false;
	  	    
	  	    if (vars.mode == 'new') {
	  			Alloy.Globals.PageManager.loadPrevious();
	  	    } else if (vars.mode == 'review') {
                //the matcher deny this event
                
                Alloy.Globals.toggleAI(true);
	  	        Api.getEventById({
                    event_id: vars.crossPath.event.id
                },
                updateEvent
                );
	  	    }
	  	}
	});
}

function showWingmanMessage(e) {
	//TODO: code this
  	var messages = ['xxx', 'yyy', 'zzz'];
  	alert( messages[ new Date().getTime() % 3 ] );
}

function updateEvent ( res ) {
    if ( res && res.length ) {
        var event          = res[0],
            disagree_users = event.disagree_users;
            disagree_users = ( disagree_users ) ? disagree_users.split(',') : [];
            
        if ( disagree_users.indexOf ( Ti.App.currentUser.id ) == -1 ) {
            disagree_users.push ( Ti.App.currentUser.id );
        }
        
        var event_data = { 
            event_id : event.id,
            custom_fields: {
                disagree_users: disagree_users.join(',')  
            }
        };

        Api.updateEvent ({ 
            data : JSON.stringify( event_data ) 
        },
        function(res) {
            Alloy.Globals.toggleAI(false);
            if ( res.success ) {
                Alloy.Globals.PageManager.load({
                    url:        'cross_paths',
                    isReset:    true
                });
            } else {
                Alloy.Globals.Common.showDialog({
                    title:      'Error',
                    message:    res.error
                });
            }
        });
    }
}