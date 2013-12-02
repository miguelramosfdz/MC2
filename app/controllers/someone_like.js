var vars = {},
	Api = require('api');

exports.init = function() {
  	loadNav();
  	
  	//
  	
  	var height = Alloy.CFG.size_380; // Math.floor( (Alloy.CFG.screenHeight - 44 /*nav*/) * 90 / 100 ); // 90% of available height
  	vars.height = height;
  	
  	$.card_0.height = height;
  	$.card_0.top = 0;
  	
  	$.card_1.height = height;
  	$.card_1.top = height;
  	
  	$.card_2.height = height;
  	$.card_2.top = 2 * height;
  	
  	var photoPath = 'large_1024';
  	if (OS_ANDROID) {
  		var width = Ti.Platform.displayCaps.platformWidth,
  			sizes = [
  				{ width: 240,  path: 'small_240' },
  				{ width: 500,  path: 'medium_500' },
  				{ width: 640,  path: 'medium_640' },
  				{ width: 1024, path: 'large_1024' }
  			];
  		for(var i=0,ii=sizes.length; i<ii; i++){
			var size = sizes[i];
			if (width < size.width) {
				photoPath = size.path;
				break;
			}
		};	
  	} else {
  		photoPath = 'medium_640';
  	}
  	vars.photoPath = photoPath;
  	
  	getFeeds();
};

function loadNav() {
	var btnMenu = Alloy.createController('elements/button', {
		icon: { width: Alloy.CFG.size_16, height: Alloy.CFG.size_15, backgroundImage: '/images/nav/btn-menu.png' },
		callback: function() {
		  	Alloy.Globals.SlidingMenu.toggleLeftDrawer();
		}
	}).getView();
	
	var btnMap = Alloy.createController('elements/button', {
		icon: { width: Alloy.CFG.size_28, height: Alloy.CFG.size_23, backgroundImage: '/images/nav/btn-map.png' },
		callback: function(){
			alert('TODO');
		}
	}).getView();
	
  	$.nav.init({
  		title: 'SOMEONE LIKE',
		left: btnMenu,
		right: btnMap
	});
}

function getFeeds() {
  	Api.searchFacebookFriends(
		function(users) {
			var userIDS = [];
			
			for (var i = 0; i < users.length; i++) {
	            userIDS.push( users[i].id );
	        }
	        
	        Api.loadFeeds(
	        	userIDS, 
	        	loadFeeds,
	        	getFeedError
	        );
		},
		function() {
			Api.loadFeeds(
				[], 
	        	loadFeeds,
	        	getFeedError
	        );
		}
	);
}

function getFeedError() {
}

function loadFeeds(users) {
	vars.users = users; 
	
	var len = users.length;
	if (len) {
		for(var i=0,ii=len >= 3 ? 3 : len; i<ii; i++){
			loadCard(i, i);
		};
	  	
	  	// mark view for the first user
	  	Api.onViewPhoto( users[0].id );
	  	
	  	vars.dataIndex = ii - 1;
	  	vars.containerIndex = 0;
	  	
	  	vars.swipeEnable = true;
	  	$.card_0.parent.addEventListener('swipe', listSwipe);
	}
	
	Alloy.Globals.toggleAI(false);
}

function loadCard(dataIndex, containerIndex) {
	var user = vars.users[dataIndex];
	
	var card = Ti.UI.createView();
		card.add( Ti.UI.createImageView({ image: user.photo.urls[vars.photoPath], width: Alloy.CFG.size_280, height: Alloy.CFG.size_280, top: 0 }) );
		card.add( Ti.UI.createImageView({ image: '/images/someone_like/gradient.png', width: Alloy.CFG.size_280, height: Alloy.CFG.size_280, top: 0 }) );
		card.add( Ti.UI.createButton({ eleType: 'button-like', userId: user.id, gender: user.custom_fields._gender, liked: user.custom_fields.liked, opacity: 0.5, backgroundImage: '/images/someone_like/love.png', width: Alloy.CFG.size_70, height: Alloy.CFG.size_63, top: Alloy.CFG.size_255 }) );
	
	var container = $['card_' + containerIndex];
	container.userId = user.id;
	container.add(card);
}

function listSwipe(e) {
  	if (e.direction == 'up') {
  		if (vars.swipeEnable == false) {
  			Alloy.Globals.Common.showDialog({
	            title:		'Someone Like',
	            message:	'There is no feed to see any more. Please try again later'
         	});
  			return;
  		}
  		
  		var prev    = vars.containerIndex, 
  			current = prev + 1,
  			next	= current + 1;
  		
  		if (prev == 1) {
  			next = 0;
  		} else if (prev == 2) {
  			current = 0;
  			next = 1;
  		}
  		
  		vars.containerIndex = current;
  		
  		//
  		
  		var currentCard = $['card_' + current];
  		currentCard.zIndex = 2;
  		
  		// mark view for current user
  		Api.onViewPhoto( currentCard.userId );
  		
  		$['card_' + prev].animate({ top: -vars.height, duration: 500 });
  		
  		currentCard.animate({ top: 0, duration: 500 }, function(e){ 
  			$['card_' + vars.containerIndex].zIndex = 1;
  		});
  		
  		$['card_' + next].animate({ top: vars.height, duration: 500 }, function(e) {
  			var currentIndex = vars.containerIndex,
  				previousIndex = (currentIndex == 0 ? 2 : currentIndex == 1 ? 0 : 1);
  				
  			var element = $['card_' + previousIndex];
  			element.top = 2 * vars.height;
  			element.removeAllChildren();
  			
  			vars.dataIndex++;
  			
  			var len = vars.users.length;
  			if (vars.dataIndex < len) {
  				loadCard(vars.dataIndex, previousIndex);
  			} else {
  				if (vars.dataIndex > len) {
  					vars.swipeEnable = false;
  				}
  			}
  		});
  	}
}

function like(e) {
	var photo = e.source;
		
  	if ( photo.userId != null && photo.eleType == 'button-like' ) {
  		photo.animate({ opacity: 1, duration: 300 });
  		
  		if (photo.isLiked != true) {
  			photo.isLiked = true;
  			
  			Api.onLikePhoto( photo.userId );
  		
	  		if ( photo.liked.indexOf( Ti.App.currentUser.id ) == -1 ) {
				loadAnimation(photo.parent, photo.gender);
			} else {
				photo.parent.add( Alloy.createController('elements/someone_like/match_found', { gender: photo.gender }).getView() );				
			}
  		} else {
  			vars.likeMessage.animate({ opacity: 0, duration: 500 }, function() {
				var message = vars.likeMessage;
				message.parent.remove(message);
				vars.likeMessage = null;
			});
  		}
  	}
}

function loadAnimation(container, gender) {
	var source = [];
	for (var i=0; i < 20; i++) { 
		source.push('/images/animation/' + i + '.jpg'); 
	};
		
  	var wrapper = Ti.UI.createView({ width: Alloy.CFG.size_260, height: Alloy.CFG.size_60, top: Alloy.CFG.size_315 });
  	vars.likeMessage = wrapper;
  	
		var image = Ti.UI.createImageView({ images: source, duration: 200, width: Alloy.CFG.size_68, height: Alloy.CFG.size_30, top: Alloy.CFG.size_5 });
		wrapper.add(image);
		image.start();
		
		var message = Ti.UI.createLabel({ text: 'analyzing... improving matches', bottom: Alloy.CFG.size_5, font: { fontSize: Alloy.CFG.size_13 }, color: '#fff', textAlign: 'center' });
		wrapper.add(message);
	container.add(wrapper);	
	
	setTimeout(function(){ 
		image.animate({ opacity: 0, duration: 500 }, function() {
			image.stop();
			wrapper.remove(image);
			image = null; 
		});
		message.animate({ opacity: 0, duration: 500 }, function(e) {
			var message2 = Ti.UI.createLabel({ text: 'MeetCute will help you cross paths with someone like ' + ( ( gender && gender.toLowerCase() == 'female') ? 'her.': 'him.' ), opacity: 0, font: { fontSize: Alloy.CFG.size_13 }, color: '#fff', textAlign: 'center' });
			wrapper.add(message2);
			message2.animate({ opacity: 1, duration: 500 });
		});
	}, 2000);
}