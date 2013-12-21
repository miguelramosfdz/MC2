var interval = Ti.App.Properties.getInt('interval'),
	locationTime = Ti.App.Properties.getDouble('locationTime'),
	locationTimeExpired = Ti.App.Properties.getInt('locationTimeExpired'),
	locationDestination = Ti.App.Properties.getObject('locationDestination'),
	geo = require('geo');

setInterval(function(){
	Ti.API.log('Meetcute: Background Services Start');
	Ti.Geolocation.getCurrentPosition(locationCallback);
}, interval);

//

function locationCallback(e) {
	Ti.API.error('locationCallback - background');
	
	if ( geo.inRange(e.coords, locationDestination) ) {
		_locationResult(1, 'Arrived');
	} else if (new Date().getTime() - locationTime > locationTimeExpired) {
		_locationResult(2, 'Timeout');
	}
}

function _locationResult(status, message) {
    var Common = require('common');
    
	Ti.API.log('Meetcute: ' + message);
	Ti.App.Properties.setBool('locationResponseFromBackground', true);
	_finishTracking();
	
	Common.trackingLocationResponse ( status );
}

function _finishTracking() {
  	Ti.App.currentService.stop();
}