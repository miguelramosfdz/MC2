var vars = {
		time: 60, // 60 seconds
		timer: null,
		mode: arguments[0].mode || 'new'
	},
	crossPath = ( arguments[0] && arguments[0].crossPath ) || {},
	Api = require('api');

exports.init = function() {
  	loadNav();
  	loadCrossPath( vars.mode );
  	
  	Alloy.Globals.toggleAI(false);
};

exports.unload = function() {
	clearTimeout(vars.timer);
	
	if ( vars.mode == 'new' ) {
	   createCrossPath( true );
	}
};

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

function goBack(e) {
	var dialog = Ti.UI.createAlertDialog({
		buttonNames: ['No', 'Yes'],
		cancel: 0,
		message: '￼Are you sure you want to cancel this place & time?￼'
	});
	dialog.show();
	dialog.addEventListener('click', function(e) {
	  	if (e.index == 1) {
	  	    crossPath = null; // null when cancel & back to cross back
	  		Alloy.Globals.PageManager.loadPrevious();
	  	}
	});
}

function updateTime() {
	var time = vars.time;

  	vars.timer = setInterval( function() {
        time--;
        if ( time >= 0 ) {
            $.lblNotification.text = '*notifications will be sent in ' + time + ' second' + ( time > 1 ? 's' : '' );
        } else {
            // Create Place & Event on the server
            if ( crossPath.place && crossPath.event ) {
                createCrossPath();
            }

            clearInterval( vars.timer );
            vars.timer = null;
            $.btnBack.parent.remove( $.btnBack );
            $.lblNotification.parent.remove( $.lblNotification );
            $.btnWingman.show();
        }
    }, 1000 );
}

function createCrossPath ( noCallback ) {
    if ( !crossPath ) {
        return;
    }
    
    if ( !noCallback ) {
        Alloy.Globals.toggleAI(true);
    }
    // does not show alert response if the user leave this screen
    Api.crossPath( 
    	{ 
    		place: JSON.stringify( crossPath.place ), 
    		event: JSON.stringify( crossPath.event ) 
    	},
    	function ( res ) {
    	    crossPath = null;
	        Alloy.Globals.toggleAI(false);
	        
    	    if ( res.error && !noCallback ) {
    	        Alloy.Globals.Common.showDialog({
                    title:      'Error',
                    message:    res.error,
                });
    	    }
    	}
    );
}

function showWingmanMessage(e) {
  	var messages = ['xxx', 'yyy', 'zzz'];
  	alert( messages[ new Date().getTime() % 3 ] );
}

function loadCrossPath( mode ) {
    if ( !crossPath.place && !crossPath.event ) {
        return;
    }
    
    var moment      = require('alloy/moment'),
        _duration   = ( moment( crossPath.event['start_time'] ).diff( moment() ) ),
        _hours      = moment.duration(_duration).hours();
        _minutes    = moment.duration(_duration - ( _hours * 3600 ) ).minutes();
        _seconds    = moment.duration(_duration - ( ( _hours * 3600 ) +  ( _minutes * 60 ) ) ).seconds();
     
    $.lblName.text    = crossPath.place['name'];
    $.lblAddress.text = crossPath.place['address'][0] ? '(' + crossPath.place['address'][0] + ')' : '';
    $.lblTime.text    = moment( crossPath.event['start_time'] ).format('h:mmA');
    $.lblCountdown.text = _hours + ' hrs ' + _minutes + ' mins ' + _seconds + ' secs ';
    
    if ( vars.mode == 'review' ) {
        $.btnBack.visible = false;
        $.lblNotification.visible = false;
        return;    
    } 

    //start countdown
    updateTime();
}