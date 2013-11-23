var crossPath   = {},
    businesses = [],
    moment      = require('alloy/moment'),
    yelp        = require('yelp');

exports.init = function() {
  	loadNav();
    initTime();
    yelp.init();
  	Alloy.Globals.toggleAI(false);
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
  	crossPath['time'] = moment(time).format();
}

function loadPreview() {
    crossPath['userId'] = Ti.App.currentUser.id;
    if ( moment( crossPath['time'] ).diff(moment()) <= 0 ) {
        Alloy.Globals.Common.showDialog({
           title:      'Invalid Time',
           message:    'Please pick a valid Time',
        });
        return;
    }
    
  	Alloy.Globals.PageManager.load({
  		url: 'cross_paths_preview',
  		isReset: false,
  	    data: crossPath
  	});
}

function initTime () {
    var time = moment().add('minutes', 30);
    
    $.lblTime.text = time.format('h:mmA');
    crossPath['time'] = time.format();
}

function surpriseMe() {
    var userLocation = Ti.App.currentUser['custom_fields']['coordinates'] && Ti.App.currentUser['custom_fields']['coordinates'][0];
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
	                   message:    'Invalid response from server. Try again.',
	                });
                    Alloy.Globals.toggleAI(false);
                }
            },
            function(e) {
                Alloy.Globals.Common.showDialog({
                   title:      'Error',
                   message:    'There was an error processing your request. Make sure you have a network connection and try again.',
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
	            id:         business.id,
	            name:       business.name,
	            is_closed:  business.is_closed,
	            url:        business.url,
	            mobile_url: business.mobile_url,
	            phone:      business.phone,
	            distance:   business.distance,
	            location:   business.location
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
    crossPath['time'] = _time.format();
}