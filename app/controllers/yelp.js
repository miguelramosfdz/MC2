var args = arguments[0] || {};

exports.init = function() {
  	loadNav();
  	
    var url = args.url;
    
    url = ( url.indexOf('http://') != -1 || url.indexOf('https://') != -1 ) ? url : 'http://m.yelp.com/search?find_desc=' + url;

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