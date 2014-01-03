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
        	createCrossPathFinished();
        }
    }, 1000 );
    
    if ( OS_IOS ) {
        Ti.App.addEventListener('pause', submitOnPause);
    }
}

function submitOnPause() {
    createCrossPath(true);
    createCrossPathFinished();
};

function createCrossPathFinished () {
    if ( OS_IOS ) {
    	Ti.App.removeEventListener('pause', submitOnPause);
    }

    vars.createOnExit = false;

    clearInterval( vars.timer );
    vars.timer = null;

    loadWingman();    
}

function isActivePage() {
  	if (Alloy.Globals.PageManager.getCache(-1).url == 'cross_paths_preview') {
  		return true;
  	}
  	return false;
}

function createCrossPath (noCallback) {
    // begin create cross path, set this true to unable to create more cross path if user unload page and click on Cross Path menu
    Ti.App.Properties.setInt('lock_cross_path', new Date().getTime());
    
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
    var userIds = [];

    for ( var i = 0, len = users.length; i < len; i++ ) {
    	var user = users[i];
    		userIds.push( user.id );
    }
    
    var index = _.random( userIds.length - 1 ) ;
    
    //add more information into crossPath[event] object
    var crossPath = vars.crossPath;
    
    // TODO: Comment out Random for now
    // crossPath['event']['matched_users']  = userIds.slice(0, index).join(',');
    crossPath['event']['matched_users']  = userIds.join(','); 
    
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
    	    // create cross path finished, remove this to unlock
    	    Ti.App.Properties.removeProperty('lock_cross_path');
    	}
    );
}

function goBack(e) {
	var dialog = Ti.UI.createAlertDialog({
		buttonNames: ['No', 'Yes'],
		cancel: 0,
		message: 'Are you sure want to cancel this place & time?'
	});
	dialog.show();
	dialog.addEventListener('click', function(e) {
	  	if (e.index == 1) {
	  	    vars.createOnExit = false;
	  	    
	  	    if (vars.mode == 'new') {
	  			Alloy.Globals.PageManager.loadPrevious();
	  	    }
	  	}
	});
}

function showWingmanMessage(e) {
	//TODO: code this
  	var messages = ['xxx', 'yyy', 'zzz'];
  	alert( messages[ new Date().getTime() % 3 ] );
}
