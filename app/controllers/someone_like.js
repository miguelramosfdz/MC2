init();
function init() {
  	loadNav();
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