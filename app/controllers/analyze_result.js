var vars = {},
	Cloud = require('ti.cloud'),
	currentUser = arguments[0] || {};

Cloud.debug = true;
	
exports.init = function() {
	$.preferenceWho.init(toggleSex, Alloy.CFG.size_100);
	$.preferenceWhen.init(showTimePicker, Alloy.CFG.size_100);
	
	subscribePush();
	loadUserInfo();
	
	var	pictureUrl = 'https://graph.facebook.com/' + currentUser.fbID + '/picture?width=320&height=320';
	downloadPicture (pictureUrl, function (res) {
    	if (res) {
    		currentUser['photo'] = res;
    	}
	});
	
	Alloy.Globals.toggleAI(false);
};

function loadUserInfo() {
	var like_age_from = 16, 
		like_age_to = 50;
		
	if ( currentUser.custom_fields ) {
		var custom_fields = currentUser.custom_fields;
	    like_age_from = Math.floor( custom_fields['age']/ 2 ) + 7;
        like_age_to   = custom_fields['age'] + 10;
        
		$.lblName.text	= custom_fields['name'];
		$.lblAge.text	= custom_fields['age'];
		$.lblGender.text	= custom_fields['_gender'];
	}
	
	$.preferenceWho.set({
		like_age_from : like_age_from,
		like_age_to : like_age_to,
		like_gender : 'Anyone'
	});

	$.preferenceWhen.set({
        busy_weekdays: Alloy.Globals.Common.reverseToBusyString( Alloy.Globals.Common.busyTime()[0] ),
        busy_weekends: Alloy.Globals.Common.reverseToBusyString( Alloy.Globals.Common.busyTime()[1] )
    });
    
	$.ageSlider.setProperties({
    	min: like_age_from,
    	max: like_age_to,
    	values: [like_age_from, like_age_to],
    	onChange: updateAgeRange
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
  	$.lblContinue.opacity = 0;
  	$.sliderContainer.opacity = 0;
}

function onScrollend(e) {
	if (e.currentPage == 2) {
		var animation = Ti.UI.createAnimation({
	  		opacity: 1,
	  		duration: 300
	  	});
		
	  	$.lblContinue.animate(animation);
	  	$.sliderContainer.animate(animation);
	}
}

// TIME PICKER

function showTimePicker(e) {
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

// update new User information
function updateUser ( e ) {
	var custom_fields = currentUser.custom_fields;
	
	var who = $.preferenceWho.get();
	custom_fields['like_gender'] 	= Alloy.Globals.Common.capitalize( who.like_gender );
	custom_fields['like_age_from'] 	= who.like_age_from;
	custom_fields['like_age_to'] 	= who.like_age_to;
	
	//busy time is formatted as: 1HHmm or 2HHmm => 1: before, 2: after, HH: 2 digits of hour, mm: 2 digits of minute, e.g : 12030 => before 20:30 (PM) , 22030 => after 20:30 (PM)
	var when = $.preferenceWhen.get();
	custom_fields['busy_weekdays'] 	= ( when.busy_weekdays ) ? Alloy.Globals.Common.formatBusyTime( when.busy_weekdays_text, when.busy_weekdays ): Alloy.Globals.Common.busyTime[0];
	custom_fields['busy_weekends'] 	= ( when.busy_weekends ) ? Alloy.Globals.Common.formatBusyTime( when.busy_weekends_text, when.busy_weekends ): Alloy.Globals.Common.busyTime[1]; 
	
	// Push Device Token
	custom_fields['device_token'] = Ti.App.Properties.getString('deviceToken', '');
	
	Cloud.Users.update( currentUser, function (e) {
	    if (e.success) {
	    	if ( e.users[0] ) {
	    		currentUser = null;
				Ti.App.currentUser = e.users[0];
				
				Alloy.Globals.Common.cacheUser();
				Alloy.Globals.WinManager.load({
					url: 'main_window'
				});
	       	}
	    } else {
	        Alloy.Globals.Common.showDialog({
	            title:		'Error',
	            message:	e.error && e.message,
         	});
	    }
	});
}

function downloadPicture( url, onload, onerror ) {
    // httpClient init
    var httpClient = Ti.Network.createHTTPClient({
    	onload: function() {
	    	onload && onload( this.responseData );
	    },
	    onerror: function() {	    	
	    	onerror && onerror();
    	},
    	timeout: 30000
    });

	httpClient.open('GET', url);
   	httpClient.send();
}

function subscribePush() {
	var deviceToken = Ti.App.Properties.getString('deviceToken', '');
	
	if ( '' == deviceToken ) {
		return;
	}
	
	Cloud.PushNotifications.subscribe({
		device_token : 	deviceToken,
		channel : 		'meetcute',
		type : 			OS_ANDROID ? 'android' : 'ios',
		user_id: 		currentUser.id
	}, function(e) {
		if (e.success) {
			Ti.API.info('PushNotifications.subscribe Success: ' + deviceToken);
		} else {
			Ti.App.Properties.setString('deviceToken', ''); // Reset to blank to register later.
			Alloy.Globals.Common.showDialog({
				title:		'Push Notifications',
				message: 	'Subscribe Token Error:\n' + ((e.error && e.message) || JSON.stringify(e))
			});
		}
	});
}