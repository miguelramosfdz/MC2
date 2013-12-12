var interval = Ti.App.Properties.getInt('interval'),
	locationTime = Ti.App.Properties.getDouble('locationTime'),
	locationTimeExpired = Ti.App.Properties.getInt('locationTimeExpired'),
	locationDestination = Ti.App.Properties.getObject('locationDestination');

setInterval(function(){
	Ti.API.log('Meetcute: Background Services Start');
	Ti.Geolocation.getCurrentPosition(locationCallback);
}, interval);

//

function locationCallback(e) {
	Ti.API.log('Meetcute Background: Current Location ' + JSON.stringify(e.coords));
	
	var location = require('location');
	if (location.checkLocation(e.coords, locationDestination)) {
		showMessage(1, 'Arrived');
		location.locationResult(1);
	} else if (new Date().getTime() - locationTime > locationTimeExpired) {
		showMessage(2, 'Timeout');
		location.locationResult(2);
	}
}

function showMessage(status, message) {
	Ti.API.log('Meetcute: ' + message);
	Ti.App.Properties.setInt('locationStatus', status);
	finishTracking();
}

function finishTracking() {
  	Ti.App.currentService.stop();
}