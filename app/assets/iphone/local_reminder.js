var notify = require('bencoding.localnotify');

exports.register = function (start_time) {
	
	Ti.App.Properties.setBool('has_active_cross_path', true );
	Ti.API.error( '[local_reminder] register' );
	
	notify.scheduleLocalNotification({
        alertBody:		"Be sure to open the app so we can verify your arrival",
        alertAction:	"open MeetCute",
        sound: 			'alarm.mp3',
        date:			new Date(start_time) 
    });
};

exports.cancelAllLocalNotifications = function() {
	
	Ti.App.Properties.setBool('has_active_cross_path', false );
	Ti.API.error( '[local_reminder] cancelAllLocalNotifications' );
	
	notify.cancelAllLocalNotifications();
};