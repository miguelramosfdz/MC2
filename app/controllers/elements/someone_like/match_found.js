var args = arguments[0] || {};

if ( args.gender && args.gender.toLowerCase() == 'male' ) {
    $.lbMessage.text = 'He liked you too!';
}

function cont(e) {
	e.source.parent.hide();
}
