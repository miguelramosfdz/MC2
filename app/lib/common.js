function showDialog(args) {
	if (!args.buttonNames) {
		args.buttonNames = ['OK'];
	}
	
	Ti.UI.createAlertDialog(args).show();
}
exports.showDialog = showDialog;

exports.checkInternet = function() {
	if ( !Ti.Network.online ) {
		showDialog({
	        title	: 'Network Error',
	        message	: 'No internet connection.'
	    });
	    
	    return false;
	}
	
	return true;
};

exports.cacheUser = function() {
	var Cloud = require('ti.cloud'),
		currentUser = Ti.App.currentUser;
	
	// http://docs.appcelerator.com/titanium/latest/#!/api/Titanium.Cloud-property-sessionId
	currentUser['session'] 		= Cloud.sessionId;
	currentUser['lastLogined'] 	= new Date().getTime();
	
	Ti.App.Properties.setObject('currentUser', currentUser);
};

exports.checkSession = function(success, error) {
	var currentUser = Ti.App.Properties.getObject('currentUser', false );
	
	if ( !currentUser ) {
		error();
		return;
	}
	
	var external_account = currentUser.external_accounts[0],
		Cloud = require('ti.cloud');
		Cloud.debug = true;
	
	Cloud.SocialIntegrations.externalAccountLogin(
		{
		    type: 	external_account.external_type,
		    token: 	external_account.token,
		    id:		external_account.external_id
		}, 
		function (e) {
		    if (e.success) {
		       	Ti.API.info ( 'externalAccountLogin: ' + JSON.stringify(e) );
				Ti.API.info ( 'Cloud.sessionId: ' + Cloud.sessionId );
				
				Ti.App.currentUser = e.users[0];
				success();
				
		    } else {
		    	Alloy.Globals.Common.showDialog({
		            title:		'Facebook Login Error',
		            message:	((e.error && e.message) || JSON.stringify(e))
	         	});
	         	
	         	Ti.App.Properties.setObject('currentUser', false );
	         	error();
		    }
		}
	);
};

exports.formatBusyTime = function ( status, strTime ) {
	var prefixNum = ( status.toLowerCase() == 'before' ) ? 1 : 2,
		result = 0;
	
	if ( strTime.length == 4 ) {
		result = parseInt( prefixNum + strTime, 10 );
	}

	return result;
}; 

exports.capitalize = function (s) {
	if ( !s ) {
		return '';
	}
	
    return s.charAt(0).toUpperCase() + s.slice(1);
};