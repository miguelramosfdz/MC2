var args = arguments[0] || {};

exports.init = function() {
  	loadNav();
  	
    var url = args.url || 'http://m.yelp.com/search?find_desc=pho&find_loc=Chicago%2C+IL';

  	$.browser.init({
  		url: url,
  		onChange: function(status, args) {}
  	});
  	
  	Alloy.Globals.toggleAI(false);
};

function loadNav() {
  	var btnBack = Ti.UI.createButton({ title: 'Back', width: Alloy.CFG.size_51, height: Alloy.CFG.size_30, top: Alloy.CFG.size_7 });
	btnBack.addEventListener('click', function(){
		Alloy.Globals.PageManager.loadPrevious();
	});
	
  	$.nav.init({
  		title: 'Cross paths',
		left: btnBack
	});
}

exports.unload = function() {
	$.browser.unload();
};