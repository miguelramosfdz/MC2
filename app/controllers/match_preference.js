var vars = {},
	Cloud = require('ti.cloud'),
	currentUser = Ti.App.currentUser || {};
	
exports.init = function() {
	loadNav();
	
	$.preferenceWho.init(toggleSex, Alloy.CFG.size_50);
	$.preferenceWhen.init(showTimePicker, Alloy.CFG.size_50);
	
	loadUserInfo();
	
	Alloy.Globals.toggleAI(false);
};

exports.unload = saveInfo;

function loadNav() {
	var btnMenu = Alloy.createController('elements/button', {
		icon: { width: Alloy.CFG.size_16, height: Alloy.CFG.size_15, backgroundImage: '/images/nav/btn-menu.png' },
		callback: function() {
		  	Alloy.Globals.SlidingMenu.toggleLeftDrawer();
		}
	}).getView();
	
  	$.nav.init({
  		title: 'Match preference',
		left: btnMenu
	});
}

function loadUserInfo() {
	var like_age_from = _min = 16, 
		like_age_to   = _max =  50,
		like_gender   = 'Anyone',
		busy_weekdays = Alloy.Globals.Common.busyTime[0],
		busy_weekends = Alloy.Globals.Common.busyTime[1];
		
	if ( currentUser.custom_fields ) {
		var custom_fields = currentUser.custom_fields;
		
		_min = Math.floor( custom_fields['age'] / 2 ) + 7;
		_max = custom_fields['age'] + 10;
		like_age_from = custom_fields.like_age_from;
		like_age_to   = custom_fields.like_age_to;
		like_gender   = custom_fields.like_gender;
		busy_weekdays = custom_fields.busy_weekdays;
		busy_weekends = custom_fields.busy_weekends;
	}

	$.preferenceWho.set({
		like_age_from : like_age_from,
		like_age_to : like_age_to,
		like_gender : like_gender 
	});
    
    $.preferenceWhen.set({
        busy_weekdays: Alloy.Globals.Common.reverseToBusyString( busy_weekdays ),
        busy_weekends: Alloy.Globals.Common.reverseToBusyString( busy_weekends )
    });
    
	$.ageSlider.setProperties({
		min : _min,
		max : _max,
		values : [ like_age_from, like_age_to ],
		onChange : updateAgeRange
	}); 
}

function updateAgeRange(type, value) {
	var data = {};
	
	if (type == 1) {
		data.like_age_from = value;
	} else {
		data.like_age_to = value;
	}
	$.preferenceWho.set(data);
}

function onScroll(e) {
  	$.sliderContainer.opacity = 0;
}

function onScrollend(e) {
	if (e.currentPage == 0) {
	  	$.sliderContainer.animate({
	  		opacity: 1,
	  		duration: 300
	  	});
	}
}

// TIME PICKER

function showTimePicker() {
	$.timePicker.show(setTime);
}

function setTime(time) {
	$.preferenceWhen.update(time);
  	$.timePicker.hide();
}

// SEX TOGGLE

function toggleSex(sex) {
  	var data = [{ title: 'Male' }, { title: 'Female' }, { title: 'Anyone' }],
	  	values = [];
  	
  	for(var i=0,ii=data.length; i<ii; i++){
		if (sex == data[i].title) {
			values[0] = i;
			break;
		}
	};
  	
  	$.valuePicker.show({
  		callback: updateSex,
  		data: [ data ],
	  	values: values
  	});
}

function updateSex(values) {
  	$.preferenceWho.set({
  		like_gender: values[0].title
  	});
  	
  	$.valuePicker.hide();
}

function saveInfo () {
    var custom_fields = currentUser.custom_fields,
    	who = $.preferenceWho.get();
    
    custom_fields['like_gender']    = Alloy.Globals.Common.capitalize( who.like_gender );
    custom_fields['like_age_from']  = who.like_age_from;
    custom_fields['like_age_to']    = who.like_age_to;
    
    //busy time is formatted as: 1HHmm or 2HHmm => 1: before, 2: after, HH: 2 digits of hour, mm: 2 digits of minute, e.g : 12030 => before 20:30 (PM) , 22030 => after 20:30 (PM)
    var when = $.preferenceWhen.get();
    
    custom_fields['busy_weekdays']  = ( when.busy_weekdays ) ? Alloy.Globals.Common.formatBusyTime( when.busy_weekdays_text, when.busy_weekdays ): Alloy.Globals.Common.busyTime()[0];// 10659 default value format: 1 => Before, 0659 => 06:59AM
    custom_fields['busy_weekends']  = ( when.busy_weekends ) ? Alloy.Globals.Common.formatBusyTime( when.busy_weekends_text, when.busy_weekends ): Alloy.Globals.Common.busyTime()[1]; //22259 default value format: 2 => After, 2259 => 22:59PM
    
    // Alloy.Globals.toggleAI(true);

    Cloud.Users.update( {
        custom_fields: custom_fields
    }, function (e) {
        // Alloy.Globals.toggleAI(false);
        if (e.success) {
            if ( e.users[0] ) {
                Ti.App.currentUser = e.users[0];
                Alloy.Globals.Common.cacheUser();
            }
        } 
        else {
            Ti.API.error ('Error: \n\t' +  e.error && e.message );
        }
    });
}
