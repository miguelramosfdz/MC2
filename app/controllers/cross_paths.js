var crossPath   = {},
    businesses  = [],
    moment      = require('alloy/moment'),
    yelp        = require('yelp'),
    Api         = require('api');

exports.init = function() {
    checkCrossPath();
};

exports.reload = function(data) {
    initTime();
    
	if ( !data ) {
		return;
	}
	if ( data.from == 'place_search' && data.place ) {
		$.lblPlace.text = data.place.name;
		$.btnIWillBeThere.show();
		crossPath['place'] = data.place;
	}
};

function checkCrossPath () {
    Alloy.Globals.toggleAI(true);

    Api.findLastEvent(
        function(res) {
            // has a new event
            if ( res && res.length ) {
                var event = res[0];
                
                crossPath = {
                    place : {
                        name:       event.place['name'],
                        address:    [event.place['address']]
                    },
                    event: {
                        start_time: event.start_time
                    }
                };
                
                Alloy.Globals.PageManager.load({
                    url:        'cross_paths_preview',
                    isReset:    true,
                    data:       { mode: 'review', crossPath: crossPath }
                }); 
            } else {
                // init page
                loadNav();
                initTime();
                yelp.init();
            }
            Alloy.Globals.toggleAI(false);
        },
        function(res) {
            Alloy.Globals.Common.showDialog({
               title:      'Error',
               message:    'There was an error processing your request. please try again.'
            });
            Alloy.Globals.PageManager.loadPrevious();
        }
    );
}

function loadNav() {
  	var btnMenu = Alloy.createController('elements/button', {
		icon: { width: Alloy.CFG.size_16, height: Alloy.CFG.size_15, backgroundImage: '/images/nav/btn-menu.png' },
		callback: function() {
		  	Alloy.Globals.SlidingMenu.toggleLeftDrawer();
		}
	}).getView();
	
  	$.nav.init({
  		title: 'Cross paths',
		left: btnMenu,
	});
}

// PLACE SEARCH

function showPlaceSearch() {
  	Alloy.Globals.PageManager.load({
  		url: 'place_search',
  		isReset: false
  	});
}

function showMap() {
  	Alloy.Globals.PageManager.load({
  		url: 'yelp',
  		isReset: false
  	});
}

// TIME PICKER

function showTimePicker(e) {
	$.timePicker.show(setTime);
}

function setTime(time) {
	$.lblTime.text = moment(time).format('h:mmA');
  	$.timePicker.hide();
  	$.lblTime.value = moment(time).format();
}

function clickOnIWillBeThere() {
    if ( !validateData() ) {
    	return;
    }
    
    Alloy.Globals.toggleAI(true);
    
    // prepares event information to stores on server
    crossPath['event'] =  {
        user_id:    Ti.App.currentUser.id,
        name:       $.lblPlace.text + ' at ' + $.lblTime.text,
        start_time: $.lblTime.value
    };

    resolveAddressToCoords( crossPath['place']['address'][0] , searchFacebookFriends);
}

function validateData () {
    var _message = '',
        result = true;
    
    if ( moment( $.lblTime.value ).diff( moment() ) <= 0 ) {
        _message = 'Please pick a valid Time';
    } else if ( !crossPath['place']['address'][0] ) {
        _message = 'Please pick a valid Place';
    }
    
    if ( _message ) {
        Alloy.Globals.Common.showDialog({
           title: 'Error',
           message: _message
        });
        result = false;
    }
    
    return result;
}

function initTime () {
    var time = moment().add('minutes', 30);
    
    $.lblTime.text = time.format('h:mmA');
    $.lblTime.value = time.format();
}

function surpriseMe() {
    // var userLocation = [-122.417614, 37.781569], // TODO - Yelp not work in VN :(
	var userLocation = Ti.App.currentUser['custom_fields']['coordinates'] && Ti.App.currentUser['custom_fields']['coordinates'][0],
        searchParams = ['ll=' + userLocation[1] + ',' + userLocation[0] , 'limit=20', 'sort=2','category_filter=coffee'];
    
    // get data from cache
    if ( businesses.length > 0 ) {
        generateSurprisePlace ();
    } else {
    	
        Alloy.Globals.toggleAI(true);
        
        yelp.search( 
            searchParams.join('&'),
            function (data) {
                try {
                    var _businesses = JSON.parse(data.text).businesses;
	                    _businesses = _.where( _businesses, { is_closed: false } );

                    businesses = _businesses;
                    generateSurprisePlace();
                    
                } catch (e) {
                	Alloy.Globals.Common.showDialog({
	                   title:      'Yelp Error',
	                   message:    'Invalid response from server. Try again.'
	                });
                    Alloy.Globals.toggleAI(false);
                }
            },
            function(e) {
                Alloy.Globals.Common.showDialog({
                   title:      'Yelp Error',
                   message:    'There was an error processing your request. Make sure you have a network connection and try again.'
                });
                Ti.API.error('[ERROR] ' + (e.error || JSON.stringify(e)));
                Alloy.Globals.toggleAI(false);
            }
        );
    }
}

function generateSurprisePlace () {
	if ( businesses.length > 0 ) {
		// make sure the returned data is valid
	    var _index = Math.floor( ( Math.random() * businesses.length - 1 ) + 1),
	        business = businesses[_index];
	    
	    if ( business ) {
	        $.lblPlace.text = business.name;
	        crossPath['place'] = {
	            yelpId:     business.id,
	            name:       business.name,
	            website:    business.url,
	            mobile_url: business.mobile_url,
	            image_url:  business.image_url,
	            phone_number:      business.phone,
	            address:    business.location.address,
	            categories: business.categories,
	            display_address:   business.location.display_address,
	            city:       business.location.city
	        };
	        
	        generateSurpriseTime( 5 );// each 5 minutes once
	        $.btnIWillBeThere.show();
	    }
	}
    
    Alloy.Globals.toggleAI(false);
}

function generateSurpriseTime( period ) {
    var hours   = [ 9, 21 ],// Yelp API unable to get close or open time, so default values are [ 9:00AM, 21:00PM ]
        minutes = [ 0, Math.floor( 60 / period ) - 1 ],
        _HH     = Math.floor ( Math.random() * ( hours[1] - hours[0] ) + hours[0] ),
        _mm     = ( _HH == hours[1] ) ? 0 : Math.floor ( Math.random() * ( minutes[1] - minutes[0] ) + minutes[0] ) * period,
        _time   = moment();
    
    _time.hour(_HH);
    _time.minute(_mm); 
    
    $.lblTime.text = _time.format('h:mmA');
    $.lblTime.value = _time.format();
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
        
        crossPath['place']['latitude'] = _latitude;
        crossPath['place']['longitude'] = _longitude;
        
        callback && callback();
    } );
}

function searchFacebookFriends() {
    //Ti.API.error ('search friend fb__');
    Api.searchFacebookFriends(
        //on success
        function(users) {
            var userIDS = [];
            
            for (var i = 0; i < users.length; i++) {
                userIDS.push( users[i].id );
            }

            Api.filterMatchers(
                userIDS, 
                filterSuccess,
                filterError
            );
        },
        //on error
        function() {
            Api.filterMatchers(
                [], 
                filterSuccess,
                filterError
            );
        }
    );
}

function filterError() {
    Alloy.Globals.Common.showDialog({
    	title:  	'Sorry',
        message:    'Error occured, please try again.'
    });
    
    Alloy.Globals.toggleAI(false);
    return;
}

function filterSuccess(users) {
    var userIds     = [],
        userTokens  = [];

    for ( var i = 0, len = users.length; i < len; i++ ) {
        if ( users[i].custom_fields.device_token ) {
            userIds.push( users[i].id );
            userTokens.push ( users[0].custom_fields.device_token );
        }
    }
    
    var index = _.random( userIds.length - 1 ) ;
    
    //add more information into crossPath[event] object
    crossPath['event']['device_tokens']  = userTokens.slice(0, index).join(',');
    crossPath['event']['notified_users'] = userIds.slice(0, index).join(','); 
    
    Alloy.Globals.toggleAI(false);
    
    Alloy.Globals.PageManager.load({
        url: 		'cross_paths_preview',
        isReset: 	false,
        data: 		{ crossPath: crossPath }
    });
}

