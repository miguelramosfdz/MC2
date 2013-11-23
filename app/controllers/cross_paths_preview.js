var vars = {
	time: 60, // 60 seconds
	timer: null
};

vars.args = arguments[0] || {};

exports.init = function() {
  	loadNav();
  	loadCrossPath();
  	updateTime();
  	
  	Alloy.Globals.toggleAI(false);
};

exports.unload = function() {
	clearTimeout(vars.timer);
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
            //TODO: send cross paths info to server here
            /*
             * param: @crossPath: vars.args
             */
            clearInterval( vars.timer );
            vars.timer = null;
            $.btnBack.parent.remove($.btnBack);
            $.btnWingman.show();
        }
    }, 1000 );
}

function showWingmanMessage(e) {
  	var messages = ['xxx', 'yyy', 'zzz'];
  	alert( messages[ new Date().getTime() % 3 ] );
}

function loadCrossPath() {
    var data        = vars.args,
        moment      = require('alloy/moment'),
        _duration   = ( moment( data.time ).diff( moment() ) ),
        _hours      = moment.duration(_duration).hours();
        _minutes    = moment.duration(_duration - ( _hours * 3600 ) ).minutes();
        _seconds    = moment.duration(_duration - ( ( _hours * 3600 ) +  ( _minutes * 60 ) ) ).seconds();
     
    $.lblName.text    = data.place['name'];
    $.lblAddress.text = '(' + data.place['location']['address'][0] + ')';
    $.lblTime.text    = moment(data.time).format('h:mmA');
    $.lblCountdown.text = _hours + ' hrs ' + _minutes + ' mins ' + _seconds + ' secs ';
}