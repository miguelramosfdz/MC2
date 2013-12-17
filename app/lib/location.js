var MATCH_DISTANCE = 0.05, // km
	locationTime,
	locationTimeExpired = 60 * 60 * 1000, // 1 hour
	locationDestination,
	backgroundServices;

exports.tracking = function(time, dest) {
	if (checkPermission() === false) {
		return;
	}
	
	locationTime = time;
	locationDestination = dest;
	
	if (OS_IOS) {
  		Ti.Geolocation.distanceFilter = 10;
		Ti.Geolocation.purpose = "Get user location";
  	}
  	
  	Ti.Geolocation.preferredProvider = "gps";
	Ti.Geolocation.accuracy = Ti.Geolocation.ACCURACY_HIGH;
	
	Ti.Geolocation.addEventListener('location', locationCallback);
	
	if (OS_IOS) {
		Ti.App.addEventListener('pause', registerService);
		Ti.App.addEventListener('resumed', removeService);
	} else {
		var activity = Ti.Android.currentActivity;
		activity.addEventListener('pause', registerService);
		activity.addEventListener('resume', removeService);
	}
};

function checkPermission() {
  	if (Ti.Geolocation.locationServicesEnabled === false) {
		showMessage('Please turn on Location services');
		return false;
	}

	if (OS_IOS) {
		var authorization = Ti.Geolocation.locationServicesAuthorization;
		if (authorization == Ti.Geolocation.AUTHORIZATION_DENIED) {
			showMessage('You have disallowed Meetcute from running geolocation services.');
			return false;
		} else if (authorization == Ti.Geolocation.AUTHORIZATION_RESTRICTED) {
			showMessage('Your system has disallowed Meetcute from running geolocation services.');
			return false;
		}
	}
	
	return true;
}

function registerService(e) {
	var interval = 3 * 60 * 1000;// 3mins
	
	Ti.App.Properties.setDouble('locationTime', locationTime);
	Ti.App.Properties.setInt('locationTimeExpired', locationTimeExpired);
	Ti.App.Properties.setObject('locationDestination', locationDestination);
	
	if (OS_IOS) {
		Ti.App.Properties.setInt('interval', interval);
		backgroundServices = Ti.App.iOS.registerBackgroundService({ url: 'location_service_ios.js' });
	} else {
		var intent = Ti.Android.createServiceIntent({ url: 'location_service_android.js' });
		intent.putExtra('interval', interval);
		
		backgroundServices = Ti.Android.createService(intent);
		backgroundServices.start(); 
	}
}

function removeService(e) {
	if (backgroundServices) {
		if (OS_IOS) {
			backgroundServices.stop();
			backgroundServices.unregister();
			Ti.App.Properties.removeProperty('interval');
		} else {
			var intent = backgroundServices.getIntent();
			if ( Ti.Android.isServiceRunning(intent) ) {
				backgroundServices.stop();
			}
		}
		backgroundServices = null;
		
		Ti.App.Properties.removeProperty('locationTime');
		Ti.App.Properties.removeProperty('locationTimeExpired');
		Ti.App.Properties.removeProperty('locationDestination');
	}
	
	var status = Ti.App.Properties.getInt('locationStatus');
	if (status == 1 || status == 2) {
		locationResult(status);		
	}
	Ti.App.Properties.removeProperty('locationStatus');
}

function locationCallback(e) {
	if (!e.success || e.error) {
		var message = translateErrorCode(e.code);
		message && showMessage( message );
		return;
	}

	Ti.API.error('Meetcute: Current Location ' + JSON.stringify(e.coords));

	if (checkLocation(e.coords, locationDestination)) {
		locationResult(1);
	} else if (new Date().getTime() - locationTime > locationTimeExpired) {
		locationResult(2);
	}
}

function checkLocation(currPos, destPos) {
    if ( !currPos || !destPos) {
        return false;
    }
    
	var p1 = new LatLon(currPos.latitude, currPos.longitude),
		p2 = new LatLon(destPos.latitude, destPos.longitude), 
		dist = p1.distanceTo(p2);
	
	if (dist <= MATCH_DISTANCE) {
		return true;
	}

	return false;
};
exports.checkLocation = checkLocation;

function finishTracking() {
    //TODO: 12-05 18:58:04.219: E/TiExceptionHandler(9158): (main) [0,22136] - Message: Uncaught RangeError: Maximum call stack size exceeded

  	Ti.Geolocation.removeEventListener('location', locationCallback);
  	
  	removeService();
  	
  	if (OS_IOS) {
		Ti.App.removeEventListener('pause', registerService);
		Ti.App.removeEventListener('resumed', removeService);
	} else {
		var activity = Ti.Android.currentActivity;
		activity.removeEventListener('pause', registerService);
		activity.removeEventListener('resume', removeService);
	}
  	
  	locationDestination = null;
  	locationTime = null;
}

function showMessage(message) {
	Ti.UI.createAlertDialog({
		title: 'Meetcute',
		message: message
	}).show();
}

function locationResult(status) {
  	finishTracking();
  	
  	//Ti.API.error ('location result___' + (status == 1) ? 'Meetcute: Arrived' : 'Meetcute: Timeout');
  	Alloy.Globals.Common.trackingLocationResponse ( status );
}

exports.locationResult = locationResult;

function translateErrorCode(code) {
	if (code == null) {
		return null;
	}
	switch (code) {
		case Ti.Geolocation.ERROR_LOCATION_UNKNOWN:
			return "Location unknown";
		case Ti.Geolocation.ERROR_DENIED:
			return "Access denied";
		case Ti.Geolocation.ERROR_NETWORK:
			return "Network error";
		case Ti.Geolocation.ERROR_HEADING_FAILURE:
			return "Failure to detect heading";
		case Ti.Geolocation.ERROR_REGION_MONITORING_DENIED:
			return "Region monitoring access denied";
		case Ti.Geolocation.ERROR_REGION_MONITORING_FAILURE:
			return "Region monitoring access failure";
		case Ti.Geolocation.ERROR_REGION_MONITORING_DELAYED:
			return "Region monitoring setup delayed";
	}
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Latitude/longitude spherical geodesy formulae & scripts (c) Chris Veness 2002-2012            */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var p1 = new LatLon(51.5136, -0.0983);                                                      */
/*    var p2 = new LatLon(51.4778, -0.0015);                                                      */
/*    var dist = p1.distanceTo(p2);          // in km                                             */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Note that minimal error checking is performed in this example code!                           */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * @requires Geo
 */

/**
 * Creates a point on the earth's surface at the supplied latitude / longitude
 *
 * @constructor
 * @param {Number} lat: latitude in numeric degrees
 * @param {Number} lon: longitude in numeric degrees
 * @param {Number} [rad=6371]: radius of earth if different value is required from standard 6,371km
 */
function LatLon(lat, lon, rad) {
	if ( typeof (rad) == 'undefined')
		rad = 6371;
	// earth's mean radius in km
	// only accept numbers or valid numeric strings
	this._lat = typeof (lat) == 'number' ? lat : typeof (lat) == 'string' && lat.trim() != '' ? +lat : NaN;
	this._lon = typeof (lon) == 'number' ? lon : typeof (lon) == 'string' && lon.trim() != '' ? +lon : NaN;
	this._radius = typeof (rad) == 'number' ? rad : typeof (rad) == 'string' && trim(lon) != '' ? +rad : NaN;
}

/**
 * Returns the distance from this point to the supplied point, in km
 * (using Haversine formula)
 *
 * from: Haversine formula - R. W. Sinnott, "Virtues of the Haversine",
 *       Sky and Telescope, vol 68, no 2, 1984
 *
 * @param   {LatLon} point: Latitude/longitude of destination point
 * @param   {Number} [precision=4]: no of significant digits to use for returned value
 * @returns {Number} Distance in km between this point and destination point
 */
LatLon.prototype.distanceTo = function(point, precision) {
	// default 4 sig figs reflects typical 0.3% accuracy of spherical model
	if ( typeof precision == 'undefined')
		precision = 4;

	var R = this._radius;
	var lat1 = this._lat.toRad(), lon1 = this._lon.toRad();
	var lat2 = point._lat.toRad(), lon2 = point._lon.toRad();
	var dLat = lat2 - lat1;
	var dLon = lon2 - lon1;

	var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	var d = R * c;
	return d.toPrecisionFixed(precision);
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/**
 * Returns the latitude of this point; signed numeric degrees if no format, otherwise format & dp
 * as per Geo.toLat()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
LatLon.prototype.lat = function(format, dp) {
	if ( typeof format == 'undefined')
		return this._lat;

	return Geo.toLat(this._lat, format, dp);
};

/**
 * Returns the longitude of this point; signed numeric degrees if no format, otherwise format & dp
 * as per Geo.toLon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {Number|String} Numeric degrees if no format specified, otherwise deg/min/sec
 */
LatLon.prototype.lon = function(format, dp) {
	if ( typeof format == 'undefined')
		return this._lon;

	return Geo.toLon(this._lon, format, dp);
};

/**
 * Returns a string representation of this point; format and dp as per lat()/lon()
 *
 * @param   {String} [format]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to display
 * @returns {String} Comma-separated latitude/longitude
 */
LatLon.prototype.toString = function(format, dp) {
	if ( typeof format == 'undefined')
		format = 'dms';

	return Geo.toLat(this._lat, format, dp) + ', ' + Geo.toLon(this._lon, format, dp);
};

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

// ---- extend Number object with methods for converting degrees/radians

/** Converts numeric degrees to radians */
if ( typeof Number.prototype.toRad == 'undefined') {
	Number.prototype.toRad = function() {
		return this * Math.PI / 180;
	};
}

/** Converts radians to numeric (signed) degrees */
if ( typeof Number.prototype.toDeg == 'undefined') {
	Number.prototype.toDeg = function() {
		return this * 180 / Math.PI;
	};
}

/**
 * Formats the significant digits of a number, using only fixed-point notation (no exponential)
 *
 * @param   {Number} precision: Number of significant digits to appear in the returned string
 * @returns {String} A string representation of number which contains precision significant digits
 */
if ( typeof Number.prototype.toPrecisionFixed == 'undefined') {
	Number.prototype.toPrecisionFixed = function(precision) {

		// use standard toPrecision method
		var n = this.toPrecision(precision);

		// ... but replace +ve exponential format with trailing zeros
		n = n.replace(/(.+)e\+(.+)/, function(n, sig, exp) {
			sig = sig.replace(/\./, '');
			// remove decimal from significand
			l = sig.length - 1;
			while (exp-- > l)
			sig = sig + '0';
			// append zeros from exponent
			return sig;
		});

		// ... and replace -ve exponential format with leading zeros
		n = n.replace(/(.+)e-(.+)/, function(n, sig, exp) {
			sig = sig.replace(/\./, '');
			// remove decimal from significand
			while (exp-- > 1)
			sig = '0' + sig;
			// prepend zeros from exponent
			return '0.' + sig;
		});

		return n;
	};
}

/** Trims whitespace from string (q.v. blog.stevenlevithan.com/archives/faster-trim-javascript) */
if ( typeof String.prototype.trim == 'undefined') {
	String.prototype.trim = function() {
		return String(this).replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	};
}

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */
/*  Geodesy representation conversion functions (c) Chris Veness 2002-2012                        */
/*   - www.movable-type.co.uk/scripts/latlong.html                                                */
/*                                                                                                */
/*  Sample usage:                                                                                 */
/*    var lat = Geo.parseDMS('51° 28′ 40.12″ N');                                                 */
/*    var lon = Geo.parseDMS('000° 00′ 05.31″ W');                                                */
/*    var p1 = new LatLon(lat, lon);                                                              */
/* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  */

var Geo = {};
// Geo namespace, representing static class

/**
 * Parses string representing degrees/minutes/seconds into numeric degrees
 *
 * This is very flexible on formats, allowing signed decimal degrees, or deg-min-sec optionally
 * suffixed by compass direction (NSEW). A variety of separators are accepted (eg 3º 37' 09"W)
 * or fixed-width format without separators (eg 0033709W). Seconds and minutes may be omitted.
 * (Note minimal validation is done).
 *
 * @param   {String|Number} dmsStr: Degrees or deg/min/sec in variety of formats
 * @returns {Number} Degrees as decimal number
 * @throws  {TypeError} dmsStr is an object, perhaps DOM object without .value?
 */
Geo.parseDMS = function(dmsStr) {
	if ( typeof deg == 'object')
		throw new TypeError('Geo.parseDMS - dmsStr is [DOM?] object');

	// check for signed decimal degrees without NSEW, if so return it directly
	if ( typeof dmsStr === 'number' && isFinite(dmsStr))
		return Number(dmsStr);

	// strip off any sign or compass dir'n & split out separate d/m/s
	var dms = String(dmsStr).trim().replace(/^-/, '').replace(/[NSEW]$/i, '').split(/[^0-9.,]+/);
	if (dms[dms.length - 1] == '')
		dms.splice(dms.length - 1);
	// from trailing symbol

	if (dms == '')
		return NaN;

	// and convert to decimal degrees...
	switch (dms.length) {
		case 3:
			// interpret 3-part result as d/m/s
			var deg = dms[0] / 1 + dms[1] / 60 + dms[2] / 3600;
			break;
		case 2:
			// interpret 2-part result as d/m
			var deg = dms[0] / 1 + dms[1] / 60;
			break;
		case 1:
			// just d (possibly decimal) or non-separated dddmmss
			var deg = dms[0];
			// check for fixed-width unseparated format eg 0033709W
			//if (/[NS]/i.test(dmsStr)) deg = '0' + deg;  // - normalise N/S to 3-digit degrees
			//if (/[0-9]{7}/.test(deg)) deg = deg.slice(0,3)/1 + deg.slice(3,5)/60 + deg.slice(5)/3600;
			break;
		default:
			return NaN;
	}
	if (/^-|[WS]$/i.test(dmsStr.trim()))
		deg = -deg;
	// take '-', west and south as -ve
	return Number(deg);
};

/**
 * Convert decimal degrees to deg/min/sec format
 *  - degree, prime, double-prime symbols are added, but sign is discarded, though no compass
 *    direction is added
 *
 * @private
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} deg formatted as deg/min/secs according to specified format
 * @throws  {TypeError} deg is an object, perhaps DOM object without .value?
 */
Geo.toDMS = function(deg, format, dp) {
	if ( typeof deg == 'object')
		throw new TypeError('Geo.toDMS - deg is [DOM?] object');
	if (isNaN(deg))
		return null;
	// give up here if we can't make a number from deg

	// default values
	if ( typeof format == 'undefined')
		format = 'dms';
	if ( typeof dp == 'undefined') {
		switch (format) {
			case 'd':
				dp = 4;
				break;
			case 'dm':
				dp = 2;
				break;
			case 'dms':
				dp = 0;
				break;
			default:
				format = 'dms';
				dp = 0;
			// be forgiving on invalid format
		}
	}

	deg = Math.abs(deg);
	// (unsigned result ready for appending compass dir'n)

	switch (format) {
		case 'd':
			d = deg.toFixed(dp);
			// round degrees
			if (d < 100)
				d = '0' + d;
			// pad with leading zeros
			if (d < 10)
				d = '0' + d;
			dms = d + '\u00B0';
			// add º symbol
			break;
		case 'dm':
			var min = (deg * 60).toFixed(dp);
			// convert degrees to minutes & round
			var d = Math.floor(min / 60);
			// get component deg/min
			var m = (min % 60).toFixed(dp);
			// pad with trailing zeros
			if (d < 100)
				d = '0' + d;
			// pad with leading zeros
			if (d < 10)
				d = '0' + d;
			if (m < 10)
				m = '0' + m;
			dms = d + '\u00B0' + m + '\u2032';
			// add º, ' symbols
			break;
		case 'dms':
			var sec = (deg * 3600).toFixed(dp);
			// convert degrees to seconds & round
			var d = Math.floor(sec / 3600);
			// get component deg/min/sec
			var m = Math.floor(sec / 60) % 60;
			var s = (sec % 60).toFixed(dp);
			// pad with trailing zeros
			if (d < 100)
				d = '0' + d;
			// pad with leading zeros
			if (d < 10)
				d = '0' + d;
			if (m < 10)
				m = '0' + m;
			if (s < 10)
				s = '0' + s;
			dms = d + '\u00B0' + m + '\u2032' + s + '\u2033';
			// add º, ', " symbols
			break;
	}

	return dms;
};

/**
 * Convert numeric degrees to deg/min/sec latitude (suffixed with N/S)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLat = function(deg, format, dp) {
	var lat = Geo.toDMS(deg, format, dp);
	return lat == null ? '–' : lat.slice(1) + (deg < 0 ? 'S' : 'N');
	// knock off initial '0' for lat!
};

/**
 * Convert numeric degrees to deg/min/sec longitude (suffixed with E/W)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toLon = function(deg, format, dp) {
	var lon = Geo.toDMS(deg, format, dp);
	return lon == null ? '–' : lon + (deg < 0 ? 'W' : 'E');
};

/**
 * Convert numeric degrees to deg/min/sec as a bearing (0º..360º)
 *
 * @param   {Number} deg: Degrees
 * @param   {String} [format=dms]: Return value as 'd', 'dm', 'dms'
 * @param   {Number} [dp=0|2|4]: No of decimal places to use - default 0 for dms, 2 for dm, 4 for d
 * @returns {String} Deg/min/seconds
 */
Geo.toBrng = function(deg, format, dp) {
	deg = (Number(deg) + 360) % 360;
	// normalise -ve values to 180º..360º
	var brng = Geo.toDMS(deg, format, dp);
	return brng == null ? '–' : brng.replace('360', '0');
	// just in case rounding took us up to 360º!
};
