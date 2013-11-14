var vars = {},
	Api = require('api');

init();

function init() {
  	loadNav();
  	
  	//
  	
  	var height = Math.floor( (Alloy.CFG.screenHeight - 44 /*nav*/) * 70 / 100 ); // 70% of available height
  	vars.height = height;
  	
  	$.card_0.height = height;
  	$.card_0.top = 0;
  	
  	$.card_1.height = height;
  	$.card_1.top = height;
  	
  	$.card_2.height = height;
  	$.card_2.top = 2 * height;
  	
  	var photoSize = 1024,
  		photoPath = 'large_1024';
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
				photoSize = size.width;
				photoPath = size.path;
				break;
			}
		};	
  	} else {
  		photoSize = 320;
  		photoPath = 'medium_640';
  	}
  	vars.photoPath = photoPath;
  	vars.photoSize = photoSize;
  	
  	getFeeds();
}

function loadNav() {
  	var btnMenu = Ti.UI.createButton({ width: Alloy.CFG.size_31, height: Alloy.CFG.size_28, backgroundImage: '/images/nav/btn-menu.png' });
	btnMenu.addEventListener('click', function(){
		Alloy.Globals.SlidingMenu.toggleLeftDrawer();
	});
	
	var btnMap = Ti.UI.createButton({ width: Alloy.CFG.size_50, height: Alloy.CFG.size_50, backgroundImage: '/images/nav/btn-map.png' });
	btnMap.addEventListener('click', function(){
		alert('TODO');
	});
	
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
		card.add( Ti.UI.createImageView({ image: user.photo.urls[vars.photoPath], width: vars.photoSize }) );
		card.add( Ti.UI.createButton({ userId: user.id, liked: user.custom_fields.liked, backgroundImage: '/images/someone_like/love.png', width: Alloy.CFG.size_70, height: Alloy.CFG.size_63, bottom: Alloy.CFG.size_60 }) );
	
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
  		
  		$['card_' + next].top = vars.height;
  		
  		var currentCard = $['card_' + current];
  		
  		// mark view for current user
  		Api.onViewPhoto( currentCard.userId );
  		
  		currentCard.zIndex = 2;
  		currentCard.animate({ top: 0, duration: 300 }, function(e){ 
  			var currentIndex = vars.containerIndex,
  				previousIndex = (currentIndex == 0 ? 2 : currentIndex == 1 ? 0 : 1);
  				
  			$['card_' + currentIndex].zIndex = 1;
  			
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
		
  	if ( photo.userId != null ) {
  		Api.onLikePhoto( photo.userId );
  		
  		if ( photo.liked.indexOf( Ti.App.currentUser.id ) == -1 ) {
			loadAnimation(photo.parent);
		} else {
			photo.parent.add( Alloy.createController('elements/someone_like/match_found').getView() );				
		}
  	}
}

function loadAnimation(container) {
	var source = [];
	for (var i=0; i < 20; i++) { 
		source.push('/images/animation/' + i + '.jpg'); 
	};
		
  	var wrapper = Ti.UI.createView({ width: Alloy.CFG.size_260, height: Alloy.CFG.size_60, bottom: Alloy.CFG.size_10, backgroundColor: '#000', borderWidth: 1, borderColor: '#fff', borderRadius: Alloy.CFG.size_10 });
		var image = Ti.UI.createImageView({ images: source, duration: 150, width: Alloy.CFG.size_68, height: Alloy.CFG.size_30, top: Alloy.CFG.size_5 });
		wrapper.add(image);
		image.start();
		
		var message = Ti.UI.createLabel({ text: 'analyzing... improving matches', bottom: Alloy.CFG.size_5, font: { fontSize: Alloy.CFG.size_13 }, color: '#fff', textAlign: 'center' });
		wrapper.add(message);
	container.add(wrapper);	
	
	setTimeout(function(){ 
		image.animate({ opacity: 0, duration: 300 }, function() {
			image.stop();
			wrapper.remove(image);
			image = null; 
		});
		message.animate({ opacity: 0, duration: 300 }, function(e) {
			var message2 = Ti.UI.createLabel({ text: 'MeetCute will help you cross paths with someone like her.', opacity: 0, font: { fontSize: Alloy.CFG.size_13 }, color: '#fff', textAlign: 'center' });
			wrapper.add(message2);
			message2.animate({ opacity: 1, duration: 300 });
			
			setTimeout(function(){ wrapper.hide(); }, 1000);
		});
	}, 1000);
}