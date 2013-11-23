exports.init = function() {
  	loadNav();
  	
  	//
  	
  	initYelp();
  	
  	Alloy.Globals.toggleAI(false);
};

function loadNav() {
  	var btnBack = Ti.UI.createButton({ title: 'Back', width: Alloy.CFG.size_51, height: Alloy.CFG.size_30, top: Alloy.CFG.size_7 });
	btnBack.addEventListener('click', function(){
		Alloy.Globals.PageManager.loadPrevious();
	});
	
  	$.nav.init({
  		title: 'Search Place',
		left: btnBack
	});
}

function initYelp() {
	// Refer here for Yelp Search API - http://www.yelp.com/developers/documentation/v2/search_api
	var userLocation = Ti.App.currentUser['custom_fields']['coordinates'] && Ti.App.currentUser['custom_fields']['coordinates'][0];
	
	$.yelp.setSearchParams(['ll=' + userLocation[1] + ',' + userLocation[0] , 'limit=20', 'sort=2']);
	$.yelp.setHandlers({
		success: function(businesses) {
			var data = [];
			_.each(businesses, function(b) {
                //does not show the business has been (permanently) closed
			    if ( !b.is_closed ) {
			        var business = {
                        id: b.id,
                        name: b.name,
                        is_closed: b.is_closed,
                        url: b.url,
                        mobile_url: b.mobile_url,
                        phone: b.phone,
                        distance: b.distance,
                        location: b.location
                    };
			        data.push(Ti.UI.createTableViewRow({ title: b.name, place: business, height: Alloy.CFG.size_40, font: { fontSize: Alloy.CFG.size_14, fontFamily: 'AGaramondPro-Regular' }, color: '#000' }));
			    }
			});
			$.placesTbl.setData(data);
		}
	});
}

exports.unload = function() {
	$.placesTbl.setData([]);
};

function pickPlace(e) {
	Alloy.Globals.PageManager.loadPrevious({ from: 'place_search', place: e.row.place });
}
