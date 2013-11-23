/*
	// Usage
	var yelp = require('yelp');
		yelp.init();
		yelp.search( ['term=' + 'food', 'location=' + 'San+Francisco'].join('&') );
*/

var oauth;

exports.init = function() {
	Ti.include("jsOAuth.js");
 
	oauth = OAuth({
		consumerKey : 		"O1iopa3tzoFJRZBipxkGpw",
		consumerSecret : 	"CFfci8YaE0-uceedJjmhb36vTbo",
		accessTokenKey : 	"ImO99ZdnZeNqTjHVLn6SaFHrZEYr-LoK",
		accessTokenSecret : "NkaCfwrL3pw8o85roAnerZWlSxo",
		serviceProvider : {
			signatureMethod : "HMAC-SHA1"
		}
	});
};

exports.search = function(params, success, error) {
	oauth.get(
		'http://api.yelp.com/v2/search?' + params,
		function(data) {
			Ti.API.info('YELP - success: \n\t ' + JSON.stringify(data));

			success && success(data);
		},
		function(data) {
			Ti.API.info('YELP - failure:\n\t ' + JSON.stringify(data));

			error && error(data);
		}
	);
};