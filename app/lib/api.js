var meetcute_api = require("ti.cloud.meetcute.api"),
	MC_API_TOKEN = '23#AFE92',
	Cloud = require('ti.cloud');
	
	Cloud.debug = true;
	
/**
 * 	1. Filter by: age & _gender & !viewed 
		Order by geo location. Limit 20
	
	2. Find the current user's Facebook Friends who also registered in the same App.
		Then exclude them :)
		http://docs.appcelerator.com/cloud/latest/#!/api/SocialIntegrations-method-facebook_search_friends 
 */
exports.loadFeeds = function(excludedUserIDS, success, error) {
	var customFields = Ti.App.currentUser.custom_fields;
	
	// exclude current user and FB Friends + viewed photo
	excludedUserIDS.push( Ti.App.currentUser.id );
	
	// TODO: Comment out filter for now
	/*
	if ( customFields.viewed ) {
		var viewed = customFields.viewed.split(':');
		
		if ( viewed.length > 0 ) {
			excludedUserIDS = excludedUserIDS.concat( viewed );	
		}
	}
	*/
	
	var filter = {
		"id": 			{ "$nin": excludedUserIDS }, 				 
		"first_name":	{ "$exists" : true },						// to make sure matchers have photo
		// TODO: Comment out filter for now
		// "$and": 		[ { "age": {"$gte": customFields.like_age_from} }, { "age": {"$lte": customFields.like_age_to} } ],
        // status:		'active'									// TODO - Enable this filter after completing the admin dashboard to approve photo
   	};
	   
   	// TODO: Comment out filter for now
   	/*
   	if ( customFields.like_gender != 'Anyone' ) {
		filter['_gender'] = customFields.like_gender;    	
   	}
   	*/
   	
   	// order by coordinates
   	if ( customFields.coordinates && customFields.coordinates.length ) {
   		filter["coordinates"] = { "$nearSphere": customFields.coordinates[0] };
   	}
   	
	Cloud.Users.query({
	    // page: 		1,
	    // per_page: 	20,
	    sel: 		{ "all": ["id", "_gender", "liked", "photo", "urls"] }, // Selects the object fields to display
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
	if ( !userId ) {
		return;
	}
	
	var customFields = Ti.App.currentUser.custom_fields;
	
	// viewed
	var viewed = customFields.viewed;
		if ( !viewed ) {
			viewed = userId;
		} else {
			viewed += ':' + userId;
		}
		
	// liked
	var liked;
	if ( isLiked ) {
		liked = customFields.liked;
		if ( !liked ) {
			liked = userId;
		} else {
			liked += ':' + userId;
		}
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

exports.crossPath = function( data, callback ) {
	data.api_token = MC_API_TOKEN;
	
	// The default generated bindings file allows you to send payload data and a success callback.
	meetcute_api.places_cross_path(
		data,
		function( res ) {
		   var res = JSON.parse ( res );
		   
		   if ( res ) {
		       callback && callback ( res );
		   }
		}
	);
};

/**
 *  1. Filter by: age & _gender 
        Order by geo location. Limit 20
    
    2. Find the current user's Facebook Friends who also registered in the same App.
        Then exclude them :)
        http://docs.appcelerator.com/cloud/latest/#!/api/SocialIntegrations-method-facebook_search_friends
    3. Interested in
    4. Time Availability
    5. Match Delay (has the user recieved a notification in the last 24 hours)
    6. Feedback
 */

//TODO: improve this filter later
exports.filterMatchers = function(excludedUserIDS, success, error) {
    var customFields = Ti.App.currentUser.custom_fields;
    
    // exclude current user and FB Friends
    excludedUserIDS.push( Ti.App.currentUser.id );
    
    // 1. Filter by: age & _gender & exclude FB friends
    var filter = {
        "id":           { "$nin": excludedUserIDS },                 
        "first_name":   { "$exists" : true },                       // to make sure matchers have photo
        // TODO: Comment out filter for now
        //"$and":      [ { "age": {"$gte": customFields.like_age_from} }, { "age": {"$lte": customFields.like_age_to} } ],
        //"like_gender": { "$in":[ customFields._gender, 'Anyone'] }, // 3. Interested in current user's gender or Anyone
        // status:      'active'                                    // TODO - Enable this filter after completing the admin dashboard to approve photo
    };
       
    // TODO: Comment out filter for now
    /*
    if ( customFields.like_gender != 'Anyone' ) {
        filter['_gender'] = customFields.like_gender;       
    }
    */
    
    // order by coordinates
    if ( customFields.coordinates && customFields.coordinates.length ) {
        filter["coordinates"] = { "$nearSphere": customFields.coordinates[0] };
    }
    
    Cloud.Users.query({
        // page:        1,
        // per_page:    20,
        sel:        { "all": ["id", "_gender", 'device_token', "liked", "photo", "urls"] }, // Selects the object fields to display
        where:      filter
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

exports.findLastEvent = function ( success, error ) {
    Cloud.Events.query({
        where: {
            user_id: Ti.App.currentUser.id,
            status: 'new'
        }
    }, function (e) {
        if (e.success) {
            success && success( e.events );
        } else {
            error && error( (e.error && e.message) || JSON.stringify(e));
        }
    });
};
