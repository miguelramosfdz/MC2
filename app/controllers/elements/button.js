var args = arguments[0],
	button = $.button;

args.button && button.applyProperties(args.button);
button.children[0].applyProperties(args.icon);

args.callback && button.addEventListener('click', args.callback);