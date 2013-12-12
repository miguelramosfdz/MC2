exports.init = function() {
  	initYelp();
  	
  	Alloy.Globals.toggleAI(false);
};

function initYelp() {
	// Refer here for Yelp Search API - http://www.yelp.com/developers/documentation/v2/search_api
	// var userLocation = Ti.App.currentUser['custom_fields']['coordinates'] && Ti.App.currentUser['custom_fields']['coordinates'][0];
	var userLocation = [-122.417614, 37.781569]; //TODO: test fot VN
	
	$.yelp.setSearchParams(['ll=' + userLocation[1] + ',' + userLocation[0] , 'limit=20', 'sort=2']);
	$.yelp.setHandlers({
		success: function(businesses) {
			var data = [];
            
			_.each(businesses, function(b) {
                //does not show the business has been (permanently) closed
			    if ( !b.is_closed ) {
			        var business = {
                        yelpId:     b.id,
                        name:       b.name,
                        website:    b.url,
                        mobile_url: b.mobile_url,
                        image_url:  b.image_url,
                        phone_number :      b.phone,
                        address:            b.location.address,
                        categories:         b.categories,
                        display_address:    b.location.display_address,
                        city:               b.location.city
                    };
					
					var row = Ti.UI.createTableViewRow({ place: business, height: Alloy.CFG.size_40, layout: 'horizontal', hasChild: true });
						row.add( Ti.UI.createLabel({ text: b.name, font: { fontSize: Alloy.CFG.size_14, fontWeight: 'bold' }, color: '#000', height: Alloy.CFG.size_40, left: Alloy.CFG.size_10 }) );
						row.add( Ti.UI.createLabel({ text: '(' + b.location.display_address[0] + ')', font: { fontSize: Alloy.CFG.size_12 }, color: '#000', height: Alloy.CFG.size_20, top: Alloy.CFG.size_10, left: Alloy.CFG.size_5, right: Alloy.CFG.size_10, wordWrap: false, ellipsize: true }) );
			        data.push(row);
			    }
			});
			$.placesTbl.setData(data);
		},
		error: function(e) {
			Alloy.Globals.Common.showDialog({
				title: 'Error',
				message: JSON.parse(e.text).error.text
			});
		}
	});
}

exports.unload = function() {
	$.placesTbl.setData([]);
};

function pickPlace(e) {
	Alloy.Globals.PageManager.loadPrevious({ from: 'place_search', place: e.row.place });
}
