// The contents of this file will be executed before any of
// your view controllers are ever executed, including the index.
// You have access to all functionality on the `Alloy` namespace.
//
// This is a great place to do any initialization for your app
// or create any global variables/functions that you'd like to
// make available throughout your app. You can easily make things
// accessible globally by attaching them to the `Alloy.Globals`
// object. For example:
//
// Alloy.Globals.someGlobalFunction = function(){};

/*
 SIZES CALCULATION
 * */

var sizeManager = require('size_manager');
sizeManager.init([
	5, 7, 9,
	10, 12, 13, 14, 16, 18,
	20, 21, 25, 28,
	30, 31, 32,
	40, 42, 44, 45,
	50, 51,
	60, 63, 68,
	70,
	80,
	100,
	200,
	260,
	270, 275,
	280,
	300,
	320
]);
Alloy.Globals.SizeManager = sizeManager;

Alloy.Globals.Common = require('common');

// support iOS 7

var pageTop = 0;
if (OS_IOS) {
	var version = Ti.Platform.version.split("."),
		major = parseInt(version[0],10);
	(major >= 7) && (pageTop = 20);
}
Alloy.CFG.pageTop = pageTop;