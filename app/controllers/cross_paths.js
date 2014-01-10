var crossPath   = {},
    businesses  = [],
    moment      = require('alloy/moment'),
    yelp        = require('yelp_api'),
    Api         = require('api'),
    vars        = {};

vars.args = arguments[0] || {};

exports.init = function() {
    // check this to make sure no more cross path be created on during a cross path is processing...
    var locked = Ti.App.Properties.getInt('lock_cross_path', 0);

    if ( locked ) {
        checkCreateCrossFinished();
    } else {
        if ( vars.args.mode && vars.args.mode == 'review' && vars.args.event_id ) {
            loadReview(vars.args.event_id);
        } else {
            checkCrossPath();
        }
    }
};

exports.reload = function(data) {
    Alloy.Globals.Common.getCurrentLocation();
    initTime();
    
	if ( !data ) {
		return;
	}
	
	if ( data.from == 'place_search' && data.place ) {
		setCrossPathsValue($.lblPlace, data.place.name);
		$.btnIWillBeThere.show();
		crossPath['place'] = data.place;
		vars.disagree = true; // Disagree matched Cross path when the Matcher change place or time
		vars.mapUrl = crossPath['place'].website || data.place.name;
	}
};

exports.cleanup = function() {
    Alloy.Globals.Common.removeLocationEvent();
};

function checkCreateCrossFinished () {
    vars.timer = setInterval( function() {
        var locked = Ti.App.Properties.getInt('lock_cross_path', 0),
            timeout = new Date().getTime() - locked;
            
        // if creating the cross path is finished 
        if ( timeout > 20 * 1000 ) {// set Timeout to unlock is 20secs
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
                if ( res.type == 'matcher' ) {
                    vars.args.mode = 'review';
                    vars.args.event_id = res.crossPath.event.event_id;
                    loadReview( vars.args.event_id );
                } else {
                    var mode = ( res.type == 'initor' ) ? 'old' : 'review';
                    
                    Alloy.Globals.PageManager.load({
                        url:        'cross_paths_preview',
                        isReset:    true,
                        data:       { mode: mode, crossPath: res.crossPath }
                    });
                }
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
    initTime();
    yelp.init();
    Alloy.Globals.Common.getCurrentLocation();
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
    var last_location = Ti.App.Properties.getObject('last_location', false);
    
  	Alloy.Globals.PageManager.load({
  		url: 'place_search',
  		isReset: false,
  		data: { location: last_location ? [ last_location.longitude, last_location.latitude ] : false }
  	});
}

function showMap() {
    if ( vars.mapUrl ) {
        Alloy.Globals.PageManager.load({
            url: 'yelp',
            isReset: false,
            data: {
                url: vars.mapUrl
            }
        });
    } else {
    	Alloy.Globals.Common.showDialog({
             title:      'Error',
             message:    'Can\'t find URL.'
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
  	vars.disagree = true; // Disagree matched Cross path when the Matcher change place or time
}

function clickOnIWillBeThere() {
    if ( vars.args.mode == 'review' && vars.args.event_id && !vars.disagree ) {
        Alloy.Globals.toggleAI(true);
        Api.getEventById({
            event_id: vars.args.event_id
        },
        acceptEvent
        );
    } else {
        // deny matched event
        if ( vars.args.mode == 'review' && vars.args.event_id && vars.disagree ) { 
            Api.getEventById({
                event_id: vars.args.event_id
            },
            denyEvent
            );
        }
        
        validateData();
    }
}

function loadCrossPathPreview () {
    crossPath['event'] =  {
        user_id:    Ti.App.currentUser.id,
        name:       $.lblPlace.text + ' at ' + $.lblTime.text,
        start_time: $.lblTime.value
    };
    
    Alloy.Globals.PageManager.load({
        url:        'cross_paths_preview',
        isReset:    false,
        data:       { mode: 'new', crossPath: crossPath }
    });
}

function validateData () {
    if ( !crossPath['place']['address'][0] ) {
        Alloy.Globals.Common.showDialog({
           title: 'Oops',
           message: 'Please pick a valid Place'
        });
    } else if ( moment( $.lblTime.value ).diff( moment() ) <= 35 * 60 * 1000 ) {// selected time must after current time, minimum is 35 mins else cross path for Tomorrow.
        $.lblTime.value = moment( $.lblTime.value ).add ('days', 1).format(); // add 1 day to start time
        
        //Confirm to create cross path for Tomorrow
        var confirm = Alloy.Globals.Common.showDialog({
           title: 'Oops',
           message: 'Just so you know you have set a time for ' + moment( $.lblTime.value ).format('h:mmA') + ' Tomorrow',
           buttonNames: ['OK','Cancel']
        });
        
        confirm.addEventListener('click', function (e) {
            // if OK
            if (e.index == 0) {
                loadCrossPathPreview();
            }
        });
    } else {
        loadCrossPathPreview();
    }
}

function initTime () {
    var time = moment().add('minutes', 36);
    setCrossPathsValue($.lblTime, time.format('h:mmA'));
    $.lblTime.value = time.format();
}

function surpriseMe() {
    var last_location = Ti.App.Properties.getObject('last_location', false);
    
    vars.disagree = true; // Disagree matched Cross path when the Matcher change place or time
    // get data from cache
    if ( businesses.length > 0 && vars.poll_businesses && ( ( new Date().getTime() - vars.poll_businesses ) < 5 * 60 * 1000 ) ) { // cache businesses for 5mins
        generateSurprisePlace ();
    } else {
        Alloy.Globals.toggleAI(true);
        //var last_location = { longitude: -122.417614, latitude: 37.781569 };
        
        if ( last_location ) {
            setYelpParams ( last_location.latitude, last_location.longitude );
        }
    }
}

function setYelpParams ( latitude, longitude ) {
    var searchParams = ['ll=' + latitude + ',' + longitude, 'limit=20', 'sort=2','category_filter=coffee', 'radius_filter=' + 15 * 1609.344 ];// radius_filter 15miles';
        
    yelp.search( 
        searchParams.join('&'),
        function (data) {
            try {
                var _businesses = JSON.parse(data.text).businesses;
                _businesses = _.where( _businesses, { is_closed: false } );

                businesses = _businesses;
                vars.poll_businesses = new Date().getTime();
                
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
	        vars.mapUrl = business.url || business.name;
	        
	        generateSurpriseTime( 5 );// each 5 minutes once
	        $.btnIWillBeThere.show();
	    }
	}
    
    Alloy.Globals.toggleAI(false);
}

function generateSurpriseTime( period ) {
    var hours   = [ 8, 20 ],// Yelp API unable to get close or open time, so default values are [ 8:00AM, 20:00PM ]
        minutes = [ 0, Math.floor( 60 / period ) - 1 ],
        _time   = moment();
    
    // time not in busy times
    checkBusyTime(hours);
    
   	var _HH = Math.floor ( Math.random() * ( hours[1] - hours[0] ) + hours[0] ),
        _mm = ( _HH == hours[1] ) ? 0 : Math.floor ( Math.random() * ( minutes[1] - minutes[0] ) + minutes[0] ) * period;
    
    if ( hours[0] == _HH && _HH < hours[1] && _mm < 35 ) {
        _mm = 35;
    }
    
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
			range[1] = busy_time.getHours();
		}
	}
	// before
	else {
		if (range[0] < busy_time.getHours()) {
			range[0] = busy_time.getHours();
		}
	}
	
	if (range[1] < range[0]) {
		range[1] = range[0];
	}
}

function setCrossPathsValue(label, text) {
	label.text = text;
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
	}
}

function loadReview ( event_id ) {
    Alloy.Globals.toggleAI(true);
    
    Api.getEventById ({
        event_id: event_id
    },
    function (res) {
        if ( res && res.length ) {
            var event = res[0];

            loadCrossPath( event );
        } else {
            Alloy.Globals.Common.showDialog({
                title:      'Error',
                message:    'Sorry, Cross Paths is not found.'
            });
        }
        Alloy.Globals.toggleAI(false);
    });
}

function loadCrossPath ( event ) { 
    loadPage();
    if (!event) {
        return;
    }

    vars.disagree = false;
    setCrossPathsValue( $.lblPlace, event.place['name'] );
    setCrossPathsValue( $.lblTime, moment(event.start_time).format('h:mmA') );
    
    $.lblTime.value = moment(event.start_time).format();
    $.btnIWillBeThere.show();
    vars.mapUrl = event.place['website'] || event.place['name'];
    
    //cache the old Place if the matcher want to create new cross path with this place
    if ( event.place ) {
        var place = event.place;
        
        crossPath['place'] = {
            yelpId:     place.custom_fields.yelpId,
            name:       place.name,
            website:    place.website,
            mobile_url: place.custom_fields.mobile_url,
            image_url:  place.custom_fields.image_url,
            phone_number:   place.phone_number,
            address:    [place.address],
            categories: place.custom_fields.categories,
            display_address:   place.custom_fields.display_address,
            city:       place.city
        };
    }
}

function acceptEvent ( res ) {
    if ( res && res.length ) {
        var event       = res[0],
            agree_users = event.agree_users;
            agree_users = ( agree_users ) ? agree_users.split(',') : [];
            
        if ( agree_users.indexOf ( Ti.App.currentUser.id ) == -1 ) {
            agree_users.push ( Ti.App.currentUser.id );
        }
        
        var event_data = { 
            event_id : event.id,
            custom_fields: {
                agree_users: agree_users.join(',')  
            }
        };

        Api.updateEvent ({ 
            data : JSON.stringify( event_data ) 
        },
        function(res) {
            Alloy.Globals.toggleAI(false);
            if ( res.success ) {
                Alloy.Globals.PageManager.load({
                    url:        'cross_paths_preview',
                    isReset:    true,
                    data:       { mode: 'review', crossPath: res.crossPath }
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

function denyEvent ( res ) {
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
                Ti.API.log('Event denied sucessfully!');
            } else {
                Alloy.Globals.Common.showDialog({
                    title:      'Error',
                    message:    res.error
                });
            }
        });
    }
}