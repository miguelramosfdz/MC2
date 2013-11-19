var vars = {},
	isReady = false;

/*
 args = {
 	min: 0,
 	max: 100,
 	values: [20, 80],
 	onChange: function(type, values){}
 }
 * */
exports.setProperties = function(args) {
	vars = args;
	checkCondition();
};

function postlayout(e) {
  	$.slider.removeEventListener('postlayout', postlayout);
  	isReady = true;
}

function checkCondition() {
  	if (isReady) {
		updateUI();
	} else {
		setTimeout(checkCondition, 500);
	}
}

function updateUI() {
  	vars.slide_range = $.slider.rect.width - $.thumb_2.rect.width;
  	vars.value_range = vars.max - vars.min;
  	
  	var values = vars.values,
  		left_1 = Math.floor( (values[0] - vars.min) * vars.slide_range / vars.value_range ),
  		left_2 = Math.floor( (values[1] - vars.min) * vars.slide_range / vars.value_range );
  	
  	if (left_1 < 0) {
		left_1 = 0;
	}
	
	if (left_2 > vars.slide_range) {
		left_2 = vars.slide_range;
	}
  	
  	$.thumb_1.left = left_1;
  	$.thumb_2.left = left_2;
}

function getValue(type) {
	var value;
	
  	if (type == 1) {
  		value = Math.floor( $.thumb_1.left * vars.value_range / vars.slide_range ) + vars.min;
  		if (value < vars.min) {
			value = vars.min;
		}
  	} else {
  		value = Math.floor( $.thumb_2.left * vars.value_range / vars.slide_range ) + vars.min;
  		if (value > vars.max) {
			value = vars.max;
		}
  	}
  	
  	vars.values[type] = value;
  	
	return value;
}

function touchstart(e) {
	e.cancelBubble = true;
  	vars.targetId = e.source.id;
  	vars.x = e.x;
}

function touchend(e) {
	e.cancelBubble = true;
  	vars.targetId = null;
}

function touchcancel(e) {
	e.cancelBubble = true;
  	vars.targetId = null;
}

function touchmove(e) {
	e.cancelBubble = true;
	
  	var pos = e.source.convertPointToView({ x: e.x, y: e.y }, $.slider),
  		newPos = pos.x - vars.x;
  		
  	if (vars.targetId == 'thumb_1') {
  		newPos = validate(0, newPos, $.thumb_2.left - e.source.rect.width);
  	} else {
  		var thumb_1 = $.thumb_1;
  		newPos = validate(thumb_1.left + thumb_1.rect.width, newPos, vars.slide_range);
  	}
  	
  	e.source.left = newPos;
  	
  	if (vars.onChange) {
  		var type = vars.targetId == 'thumb_1' ? 1 : 2;
  		vars.onChange(type, getValue(type));
  	}
}

function validate(min, value, max) {
  	if (value < min) {
  		return min;
  	} else if (value > max) {
		return max;
	} else {
		return value;
	}
}