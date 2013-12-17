/**
 * The yelp widget sends a query to the YELP API to retrieve business data.
 * In the view, it appears as a search bar with a textbox and a button icon.
 *
 * ### Usage
 *
 * To use the widget, first add it as a dependency in the `config.json` file:
 *
 *     "dependencies": {
 *         "com.imobicloud.yelp":"1.0"
 *     }
 *
 * Next, add it to a view in the project, using the Require tag:
 *
 *     <Require id="yelp" type="widget" src="com.imobicloud.yelp"/>
 *
 * Note: the `id` attribute is a unique identfier and can be anything. `yelp` is just an example.
 *
 * In the controller, use the `setHandlers` method to register a callback to process the retrieved data.
 *
 *     function processData(businesses){
 *        var data = [];
 *        businesses.forEach(function(b){
 *            var row = Ti.UI.createTableViewRow({title:b.name});
 *            data.push(row)
 *        });
 *        // tableView is a Ti.UI.TableView object in the view
 *        $.tableView.setData(data);
 *     }
 *     $.yelp.setHandlers({
 *        success: processData
 *     });
 *
 * ### Accessing View Elements
 *
 * The following is a list of GUI elements in the widget's view.  These IDs can be used to
 * override or access the properties of these elements:
 *
 * - `bar`: Titanium.UI.View for the entire widget.
 * - `text`: Titanium.UI.TextField for the search box.
 * - `searchView`: Titanium.UI.View for the icons and acts as a button.
 * - `search`: Titanium.UI.ImageView for the search icon.
 * - `loading`: Alloy.widgets.loading for the loading icon.
 *
 * Prefix the special variable `$` and the widget ID to the element ID, to access
 * that view element, for example, `$.yelp.text` will give you access to the TextField.
 */


var HANDLERS = ['success','error', 'cancel'];

var AppModel = require('alloy/backbone').Model.extend({ loading: false });
var model = new AppModel();
var handlers = {};
var searchParams = [];

// react to changes in the model state
// model.on('change:loading', function(m) {
	// if (m.get('loading')) {
		// $.loading.setOpacity(1.0);
	// } else {
		// $.loading.setOpacity(0);
	// }
// });

////////////////////////////////////
///////// public functions /////////
////////////////////////////////////
/**
 * @method setHandlers
 * Binds callback handlers to events
 * @param {Object} args Callbacks to register.
 * @param {function(Array.<Object>)} args.success Callback fired after successfully retrieving book data.
 * Passed context is an array of book data {`title`:String, `authors`:String, `image`:String}.
 * @param {function(Object)} [args.error] Callback to override the default error handling.
 * Passed context is an error object, which is the same as the one from Titanium.Network.HTTPClient.onerror.
 */

exports.setHandlers = function(args) {
	_.each(HANDLERS, function(h) {
		if (args[h]) {
			handlers[h] = args[h];
		}
	});
};

exports.focus = function() {
	$.text.focus();
};

exports.setSearchParams = function(params) {
	searchParams = params;
};

///////////////////////////////////////
////////// private functions //////////
///////////////////////////////////////
function processData(data) {
	var result = [];

	// make sure the returned data is valid
	var businesses;
	try {
		businesses = JSON.parse(data.text).businesses;
	} catch (e) {
		alert('Invalid response from server. Try again.');
		return;
	}

	// process each book, turning it into a table row
	for (var i = 0; i < businesses.length; i++) {
		var b = businesses[i];
		
		result.push(b);
	}

	// fire success handler with result
	handlers.success(result);
}

////////////////////////////////////
////////// event handlers //////////
////////////////////////////////////
function search() {
	$.text.blur();

	// validate search data
	var value = encodeURIComponent($.text.value);
	if (!value) {
		alert('You need to enter search text');
		return;
	}
	
	searchParams.push('term=' + value);

	// search Yelp API
	model.set('loading', true);
	
	var yelp = require('yelp_api');
		yelp.init();
		
	yelp.search( 
		searchParams.join('&'),
		function(data) {
			if (handlers.success) {
				processData(data);
			}
			model.set('loading', false);
		},
		function(e) {
			if (handlers.error) {
				handlers.error(e);
			} else {
				alert('There was an error processing your search. Make sure you have a network connection and try again.');
				Ti.API.error('[ERROR] ' + (e.error || JSON.stringify(e)));
			}
			model.set('loading', false);
		}
	);
}

function cancel(e) {
  	if (handlers.cancel) {
		handlers.cancel();
	}
}