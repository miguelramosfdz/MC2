var onChange;

exports.init = function(args) {
	onChange = args.onChange;
	args.url && ($.browser.url = args.url);
};

exports.load = function(args) {
	$.browser.url = args.url;
};

exports.unload = function() {
	var browser = $.browser;
	browser.stopLoading(true);
	
	if (OS_ANDROID) {
		// browser.release(); //TODO: this cause bug on Android
	}
	
	browser.parent.remove(browser);
	browser = null;
};

function updateStatus() {
  	var browser = $.browser;
  	$.btnBack.enabled = browser.canGoBack();
  	$.btnNext.enabled = browser.canGoForward();
}

function goBack(e) {
  	$.browser.goBack();
}

function goForward(e) {
  	$.browser.goForward();
}

function reloadPage(e) {
  	$.browser.reload();
}

function showActionDialog(e) {
  	$.actionDialog.show();
}

function actionDialogClicked(e) {
	var title = $.browser.evalJS("document.title"),
		url = $.browser.url;
	
	switch(e.index) {
		case 0:
			Ti.UI.Clipboard.setText(url);
			break;
		case 1:
			if (Ti.Platform.canOpenURL(url)) {
				Ti.Platform.openURL(url);
			}
			break;
		case 2:
			var emailDialog = Ti.UI.createEmailDialog({});
			emailDialog.subject = title;
			emailDialog.messageBody = url;
			emailDialog.open();
			break;
	}
}

function browserBeforeLoad(e) {
  	$.btnAction.enabled = false;
  	
  	onChange(0, {
		url: e.url
	});
}

function browserOnLoad(e) {
	updateStatus();
	$.btnAction.enabled = true;
	
	onChange(1, {
		title: $.browser.evalJS("document.title"),
		url: e.url
	});
}

function browserError(e) {
  	updateStatus();
	$.btnAction.enabled = false;
	
	onChange(2, e);
}