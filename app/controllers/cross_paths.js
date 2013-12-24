var crossPath   = {},
    businesses  = [],
    moment      = require('alloy/moment'),
    yelp        = require('yelp_api'),
    Api         = require('api'),
    vars        = {};

exports.init = function() {
    // check this to make sure no more cross path be created on during a cross path is processing...
    var locked = Ti.App.Properties.getBool('lock_cross_path', false);
    
    if ( locked ) {
        checkCreateCrossFinished();
    } else {
        checkCrossPath();
    }
};

exports.reload = function(data) {
    initTime();
    
	if ( !data ) {
		return;
	}
	
	if ( data.from == 'place_search' && data.place ) {
		setCrossPathsValue($.lblPlace, data.place.name);
		$.btnIWillBeThere.show();
		crossPath['place'] = data.place;
	}
};

function checkCreateCrossFinished () {
    vars.timer = setInterval( function() {
        var locked = Ti.App.Properties.getBool('lock_cross_path', false);
        
        // if creating the cross path is finished 
        if ( !locked ) {
            clearInterval( vars.timer );
            vars.timer = null;
            checkCrossPath();
        }
    }, 1000 );
}

function checkCrossPath () {
    Alloy.Globals.toggleAI(true);
    
    Api.checkCrossPath( 
        Ti.App.currentUser.id,
        function ( res ) {
            Alloy.Globals.toggleAI(false);
            if ( res.has_active_cross_path ) {
                var mode = ( res.type == 'initor' ) ? 'old' : 'review';

                Alloy.Globals.PageManager.load({
                    url:        'cross_paths_preview',
                    isReset:    true,
                    data:       { mode: mode, crossPath: res.crossPath }
                });
            } else {
                loadPage();
            }
        },
        function ( res ) {
            Alloy.Globals.toggleAI(false);
            Alloy.Globals.PageManager.loadPrevious();
        }
    );
}

// init page
function loadPage () {
    loadNav();
    getCurrentLocation();
    initTime();
    yelp.init();
}

function getCurrentLocation() {
    var last_location = Ti.App.Properties.getObject('last_location', false);

    if ( last_location && ( ( new Date().getTime() - last_location.timestamp ) < 5 * 60 * 1000 ) ) { //cache last location for 5mins
        vars.currentLocation = [ last_location.longitude, last_location.latitude ];
    } else {
        Alloy.Globals.Common.getCurrentLocation ( function (coords) {
            if ( coords.longitude && coords.latitude ) {
                vars.currentLocation = [ coords.longitude, coords.latitude ];
            }
        });
    }
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
  		isReset: false,
  		data: { location: vars.currentLocation }
  	});
}

function showMap() {
	if (crossPath['place']) {
		Alloy.Globals.PageManager.load({
	  		url: 'yelp',
	  		isReset: false,
	  		data: {
	  			url: crossPath['place'].website
	  		}
	  	});
	} else {
		Alloy.Globals.PageManager.load({
	  		url: 'yelp',
	  		isReset: false
	  	});
	}
}

// TIME PICKER

function showTimePicker(e) {
	$.timePicker.show(setTime);
}

function setTime(time) {
	setCrossPathsValue($.lblTime, moment(time).format('h:mmA'));
  	$.timePicker.hide();
  	$.lblTime.value = moment(time).format();
}

function clickOnIWillBeThere() {
    if ( !validateData() ) {
    	return;
    }
    
    Alloy.Globals.toggleAI(true);
    
    crossPath['event'] =  {
        user_id:    Ti.App.currentUser.id,
        name:       $.lblPlace.text + ' at ' + $.lblTime.text,
        start_time: $.lblTime.value
    };
    
    Alloy.Globals.PageManager.load({
        url: 		'cross_paths_preview',
        isReset: 	false,
        data: 		{ mode: 'new', crossPath: crossPath }
    });
}

function validateData () {
    var _message = '',
        result = true;
    
    // selected time must after current time, minimum is 35 mins.
    if ( moment( $.lblTime.value ).diff( moment() ) <= 35 * 60 * 1000 ) {
        _message = 'Too late to create a Cross path, Please pick a valid Time';
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
    var time = moment().add('minutes', 36);
    setCrossPathsValue($.lblTime, time.format('h:mmA'));
    $.lblTime.value = time.format();
}

function surpriseMe() {
    // get data from cache
    if ( businesses.length > 0 ) {
        generateSurprisePlace ();
    } else {
        Alloy.Globals.toggleAI(true);
        //var currentLocation = [-122.417614, 37.781569];
		var currentLocation = vars.currentLocation || ( Ti.App.currentUser['custom_fields']['coordinates'] && Ti.App.currentUser['custom_fields']['coordinates'][0] );
        
        if ( currentLocation && currentLocation.length == 2 ) {
            setYelpParams ( currentLocation );
        }
    }
}

function setYelpParams ( currentLocation ) {
    var searchParams = ['ll=' + currentLocation[1] + ',' + currentLocation[0] , 'limit=20', 'sort=2','category_filter=coffee', 'radius_filter=' + 15 * 1609.344 ];// radius_filter 15miles';
        
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

function generateSurprisePlace () {
	if ( businesses.length > 0 ) {
		// make sure the returned data is valid
	    var _index = Math.floor( ( Math.random() * businesses.length - 1 ) + 1),
	        business = businesses[_index];
	    
	    if ( business ) {
	        setCrossPathsValue($.lblPlace, business.name);
	        
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
        _time   = moment();
    
    // time not in busy times
    checkBusyTime(hours);
    
    // time must greater than current time
    if (hours[0] <= _time.hour()) {
    	hours[0] = _time.hour() + 1;
    }
        
   	var _HH     = Math.floor ( Math.random() * ( hours[1] - hours[0] ) + hours[0] ),
        _mm     = ( _HH == hours[1] ) ? 0 : Math.floor ( Math.random() * ( minutes[1] - minutes[0] ) + minutes[0] ) * period;
    
    _time.hour(_HH);
    _time.minute(_mm); 
    
    setCrossPathsValue($.lblTime, _time.format('h:mmA'));
    $.lblTime.value = _time.format();
}

function checkBusyTime(range) {
	// busy time is formatted as: 1HHmm or 2HHmm => 1: before, 2: after, HH: 2 digits of hour, mm: 2 digits of minute
	// e.g : 12030 => before 20:30 (PM) , 22030 => after 20:30 (PM)
	
	var custom_fields = Ti.App.currentUser['custom_fields'],
	    weekday = new Date().getDay(),
		strTime = '' + ( ( weekday != 0 || weekday != 6 ) ? custom_fields.busy_weekdays : custom_fields.busy_weekends ),
  		prefix  = strTime.substr(0, 1),
        hours   = strTime.substr(1, 2),
        minutes = strTime.substr(3);
	
	var busy_time = new Date();
	busy_time.setHours(hours);
	busy_time.setMinutes(minutes);
	
	// after
	if (prefix == '2') {
		if (range[1] > busy_time.getHours()) {
			range[1] = busy_time.getHours() - 1;
		}
	}
	// before
	else {
		if (range[0] < busy_time.getHours()) {
			range[0] = busy_time.getHours() + 1;
		}
	}
	
	if (range[1] < range[0]) {
		range[1] = range[0];
	}
}

function setCrossPathsValue(label, text) {
	if (OS_IOS) {
		label.attributedString = Ti.UI.iOS.createAttributedString({
		    text: text,
		    attributes: [
		        // Underlines text
		        {
		            type: Titanium.UI.iOS.ATTRIBUTE_UNDERLINES_STYLE,
		            value: Titanium.UI.iOS.ATTRIBUTE_UNDERLINE_STYLE_SINGLE,
		            range: [0, text.length]
		        }
		    ]
		});
	} else {
		label.text = text;
	}
}