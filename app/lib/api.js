var Cloud = require('ti.cloud');
	Cloud.debug = true;
	
var customFields = Ti.App.currentUser.custom_fields;	

/**
 * 	1. Filter by: age & _gender & !viewed 
		Order by geo location. Limit 20
	
	2. Find the current user's Facebook Friends who also registered in the same App.
		Then exclude them :)
		http://docs.appcelerator.com/cloud/latest/#!/api/SocialIntegrations-method-facebook_search_friends 
 */
exports.loadFeeds = function(excludedUserIDS, success, error) {
	// exclude current user and FB Friends + viewed photo
	excludedUserIDS.push( Ti.App.currentUser.id );
	
	if ( customFields.viewed ) {
		var viewed = customFields.viewed.split(':');
		
		if ( viewed.length > 0 ) {
			excludedUserIDS = excludedUserIDS.concat( viewed );	
		}
	}
	
	var filter = {
		"id": 			{ "$nin": excludedUserIDS }, 				 
		"first_name":	{ "$exists" : true },						// to make sure matchers have photo
		"$and": 		[ { "age": {"$gte": customFields.like_age_from} }, { "age": {"$lte": customFields.like_age_to} } ],
		"coordinates": 	{ "$nearSphere": customFields.coordinates[0] }
        // status:		'active'									// TODO - Enable this filter after completing the admin dashboard to approve photo
   	};
   
   	if ( customFields.like_gender != 'Anyone' ) {
		filter['_gender'] = customFields.like_gender;    	
   	}
   	
   	// order by coordinates
   	if ( customFields.coordinates && customFields.coordinates.length ) {
   		filter["coordinates"] = { "$nearSphere": customFields.coordinates[0] };
   	}
   	
	Cloud.Users.query({
	    // page: 		1,
	    // per_page: 	20,
	    sel: 		{ "all": ["id", "liked", "photo", "urls"] }, // Selects the object fields to display
	    where: 		filter
	}, function (e) {
	    if (e.success) {
	    	success && success( e.users );
	    	
	    } else {
	    	error && error();
	    	
	        alert('Error:\n' +
	            ((e.error && e.message) || JSON.stringify(e)));
	    }
	});
};

exports.searchFacebookFriends = function(success, error) {
	Cloud.SocialIntegrations.searchFacebookFriends(function (e){
	    if (e.success) {
	    	success && success(e.users);
	    	
	    } else {
	    	error && error();
	    	
	        alert('Error:\n' +
	            ((e.error && e.message) || JSON.stringify(e)));
	    }
	});
};

/**
 * Mark photo as viewed
 */
function onViewPhoto( userId, isLiked ) {
	// viewed
	var viewed = customFields.viewed;
		if ( !viewed ) {
			viewed = [userId];
		} else {
			viewed = viewed.split(':');
			viewed.push(userId);
		}
		viewed = viewed.join(':');
		
	// liked
	var liked;
	if ( isLiked ) {
		liked = customFields.liked;
			if ( !liked ) {
				liked = [userId];
			} else {
				liked = liked.split(':');
				liked.push(userId);
			}
			liked = liked.join(':');
	}
	
	Cloud.Users.update(
		{
			custom_fields: isLiked ? { viewed: viewed, liked: liked } : { viewed: viewed }
    	},
    	function () {
    		customFields.viewed = viewed;
    		
    		if ( isLiked ) {
    			customFields.liked = liked;
    		}

    		var u = Ti.App.currentUser;
	    		u.custom_fields = customFields;
	    	
	    	Ti.App.currentUser = u;
    	}
    );
}
exports.onViewPhoto = onViewPhoto;

/**
 * Mark photo as viewed & liked
 */
exports.onLikePhoto = function(userId) {
	onViewPhoto( userId, true );
};