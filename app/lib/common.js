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
				Ti.App.currentUser = e.users[0];
				Alloy.Globals.Common.cacheUser();
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

/*
 @return default value of busy time  ([before 06:69, after: 22:59])
 * 10659 default value format: 1 => Before, 0659 => 06:59AM
 * 22259 default value format: 2 => Before, 2259 => 22:59PM
 * */
exports.busyTime = function() {
    return [ 10659, 22259 ];
};

exports.reverseToBusyString = function  ( time ) {
    var result = {},
        moment = require('alloy/moment');
    
    time = time.toString();
    if ( time && time.length == 5 ) {
        var temp        = time.slice(1),
            realTime    = [ temp.slice(0, 2), temp.slice(2) ],
            _date       = moment();
    
        _date.hour( parseInt ( realTime[0], 10 ) );
        _date.minute( parseInt ( realTime[1], 10 ) ); 
    
        result = {
            prefix: ( time.charAt(0) == 2 ) ? 'After' : 'Before',
            time:   _date.format('h:mmA'),
            value:  realTime.join('')
        };
    }
    
    return result;
};
