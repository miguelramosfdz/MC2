var vars = {},
	currentUser = arguments[0] || {};
	
init();

function init() {
	loadUserInfo();
	
	var	pictureUrl = 'https://graph.facebook.com/' + currentUser.fbID + '/picture?width=320&height=320';
	downloadPicture (pictureUrl, function (res) {
    	if (res) {
    		currentUser['photo'] = res;
    	}
	});
}

function loadUserInfo () {
	if ( currentUser.custom_fields ) {
		var custom_fields = currentUser.custom_fields;
		
		$.lbName.text	= custom_fields['name'];
		$.lbAge.text	= custom_fields['age'];
		$.lbGender.text	= custom_fields['gender'];
		$.lblCity.text	= custom_fields['city'];
	}
}

// PREFIX TOGGLE

function togglePrefix(e) {
  	var v = e.source.text;
  	
  	e.source.text = ((v == 'After:') ? 'Before:' : 'After:'); 
}

// TIME PICKER
function showTimePicker(e) {
	vars.target = e.source;
	$.timePicker.show(setTime);
}

function setTime(time) {
	var moment = require('alloy/moment'),
		
	arrTime = time.toTimeString().split(':');
	vars.target.text = moment(time).format('h:mA');
	vars.target.value = arrTime[0]+ arrTime[1];
  	
  	$.timePicker.hide();
}

// SEX TOGGLE

function toggleSex(e) {
	vars.target = e.source;
  	
  	var data = [{ title: 'Male' }, { title: 'Female' }, { title: 'Anyone' }],
	  	values = [];
  	
  	for(var i=0,ii=data.length; i<ii; i++){
		if (e.source.text == data[i].title) {
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
  	vars.target.text = values[0].title;
  	$.valuePicker.hide();
}

// AGE PICKER

function showAgePicker(e) {
  	vars.target = e.source;
	
	$.ageSlider.value = parseInt(e.source.text, 10);
	$.ageSlider.show();
}

function setAge(e) {
	vars.target && (vars.target.text = Math.floor(e.value));
  	// $.agePicker.hide();
}

// update new Account information
function updateAccount ( e ) {
	var Cloud = require('ti.cloud'),
		custom_fields = currentUser.custom_fields;
	
	Cloud.debug = true;

	custom_fields['like_gender'] 	= Alloy.Globals.Common.capitalize($.lbTargetGender.text);
	custom_fields['like_age_from'] 	= parseInt($.ageFrom.text, 10);
	custom_fields['like_age_to'] 	= parseInt($.ageTo.text, 10);
	
	//busy time is formatted as: 1HHmm or 2HHmm => 1: before, 2: after, HH: 2 digits of hour, mm: 2 digits of minute, e.g : 12030 => before 20:30 (PM) , 22030 => after 20:30 (PM)
	custom_fields['busy_weekdays'] 	= ( $.lbBusyValue.value ) ? Alloy.Globals.Common.formatBusyTime( $.lbBusyText.text.replace(':',''), $.lbBusyValue.value ): 10659;// 10659 default value format: 1 => Before, 0659 => 06:59AM
	custom_fields['busy_weekends'] 	= ( $.lbWeekendsValue.value ) ? Alloy.Globals.Common.formatBusyTime( $.lbWeekendsText.text.replace(':',''), $.lbWeekendsValue.value ): 22259; //22259 default value format: 2 => Before, 2259 => 22:59PM
	
	Cloud.Users.update( currentUser, function (e) {
	    if (e.success) {
	    	if ( e.users[0] ) {
	    		currentUser = null;
				Ti.App.currentUser = e.users[0];
				
				Alloy.Globals.Common.cacheUser();
				Alloy.Globals.WinManager.load('main_window');
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
	    	Alloy.Globals.Common.showDialog({
	            title:		'Error',
	            message:	this.status,
         	});
	    	onerror && onerror();
    	},
    	timeout: 30000
    });

	httpClient.open('GET', url);
   	httpClient.send();
}
