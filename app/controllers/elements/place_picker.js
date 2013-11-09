var callback;

exports.init = function(places, fnc) {
	callback = fnc;
	
	//
	
	var picker = $.picker;
  	picker.search = Ti.UI.createSearchBar({ hintText: 'Search', showCancel: true });
  	
  	//
  	
  	var data = [];
  	for(var i=0,ii=places.length; i<ii; i++){
		data.push( Ti.UI.createTableViewRow({ title: places[i].title, hasChild: true, height: Alloy.CFG.size_40, font: { fontSize: Alloy.CFG.size_16 }, color: '#000' }) );
	};
	picker.setData(data);
};

exports.show = function() {
	$.picker.show();
};

function pickerClicked(e) {
  	callback( e.row.title );
  	$.picker.hide();
}