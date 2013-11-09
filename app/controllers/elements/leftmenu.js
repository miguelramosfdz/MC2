function menuClicked(e) {
  	if (e.source.url) {
  		Alloy.Globals.PageManager.load(e.source.url);
  		Alloy.Globals.SlidingMenu.toggleLeftDrawer();
  	}
}