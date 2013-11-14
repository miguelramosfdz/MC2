var Alloy = require('alloy');

function PageManager() {
	var UIManager,
		container,
		onChange;
	
	// PRIVATE FUNCTIONS ========================================================
	
	/*
	args = {
		container: element,
	 	defaultPage: '',
		onChange: function(status, params){
			status = 
			  - 0: start load
			  - 1: loading
			  - 2: load finish
			  - 3: view destroy
		}
	}	
	 * */
	function init(args) {
	  	container = args.container;
		onChange = args.onChange || function() {};
	  	
	  	var oUIManager = require('ui_manager');
	  	UIManager = new oUIManager(UIChange);
		
		args.defaultPage && load({
			url: args.defaultPage
		});
	  	
	  	Ti.API.log('Page Manager: initialized');
	}
	
	function UIChange(status, params, view) {
	  	if (onChange(status, params, view) === false) { return false; }
	  	
	  	var oSwitch = {
			0: pageBeforeLoad,
			1: pageLoaded,
			2: pageDestroy
		};
		return oSwitch[status](params, view);
	}
	
	function pageBeforeLoad(params) {}
	
	function pageLoaded(params, view) {
		// make page visible
		container.add( params.controller.getView() );
	}
	
	function pageDestroy(params, view) {
		// hide page
		container.remove( params.controller.getView() );
	}
	
	/*
	 params:
	  - url: the url of the page
	  - data: data for that page
	  - isReset: remove previous page or not, default is true
	 * */
	function load(params) {
		Ti.API.log('Page Manager: Load page ' + params.url + ': ' + JSON.stringify( params.data ));
		
		UIManager.set(params);
	  	
		Ti.API.log('Page Manager: Cached page: ' + UIManager.get().length);
	};
	
	/*
	 params: 
	  - count: number of revious pages will be removed
	  - data: new data for current page
	 * */
	function loadPrevious(data, count) {
	  	UIManager.setPrevious(data, count);
		
		Ti.API.log('Page Manager: Cached page: ' + UIManager.get().length);
	};
	
	function getCache(index) {
	  	return UIManager.get(index); 
	}
	
	/*
	 if an URL is offered, load that page and reset cache
	 if not, reset cache
	 * */
	function reset(params) {
		if (url != null) {
			load(params);
			
			// remove all page except the last page : index -1
			UIManager.remove(-2, 0);
		} else {
			UIManager.reset();
		}
	  	
	  	Ti.API.log('Page Manager: Reset! Cached page: ' + UIManager.get().length);
	}
	
	// PUBLIC FUNCTIONS ========================================================
	
	return {
		init: init,
		load: load,
		loadPrevious: loadPrevious,
		getCache: getCache,
		reset: reset
	};
}
module.exports = PageManager;