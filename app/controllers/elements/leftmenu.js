function menuClicked(e) {
  	if (e.source.url) {
  		Alloy.Globals.toggleAI(true);
  		
  		Alloy.Globals.PageManager.load({
  			url: e.source.url
  		});
  		
  		Alloy.Globals.SlidingMenu.toggleLeftDrawer();
  	}
}