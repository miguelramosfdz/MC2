
/*
 params = {
 	left: {
 		title: '',
 		callback: function(){}
 	},
 	right: {
 		icon: '',
 		callback: function(){}
 	}, // or TiView
 	title: '', // or element
 }
 * */
exports.init = function(params) {
	loadLeftButton(params.left);
  	
	loadRightButton(params.right);
  	
  	loadTitle(params.title);
};

/*
 If one of params's properties is
 - null: no change
 - false: it is empty
 - object: update it
 * */
exports.update = function(params) {
	if (params.left != null) {
		var child = $.left.children;
		if (child.length == 1) {
			$.left.remove(child[0]);
		}
		loadLeftButton(params.left);
	}
	
	if (params.right != null) {
		child = $.right.children;
		if (child.length == 1) {
			$.right.remove(child[0]);
		}
		loadRightButton(params.right);
	}
	
	if (params.title != null) {
		child = $.center.children;
		if (child.length) {
			$.center.remove(child[0]);
		}
		loadTitle(params.title);
	}
};

function createButton(title) {
  	return Ti.UI.createButton({ title: title, width: Alloy.CFG.size_44, height: Alloy.CFG.size_44, backgroundImage: 'NONE', font: { fontSize: Alloy.CFG.size_9, fontFamily: 'AGaramondPro-Regular' }, color: '#fff' });
}

function createImageButton(icon) {
  	var button = Ti.UI.createView({ width: Alloy.CFG.size_44, height: Alloy.CFG.size_44 });
	button.add( Ti.UI.createImageView({ image: icon, width: Alloy.CFG.size_25, height: Alloy.CFG.size_25 }) );
	return button;
}

function loadLeftButton(left) {
	if (left) {
		var width,
			leftContainer = $.left;
		
  		if (left.callback) {
  			width = Alloy.CFG.size_44;
  			
  			var btnLeft = left.icon ? createImageButton(left.icon) : createButton(left.title);
			btnLeft.addEventListener('singletap', left.callback);
			leftContainer.add(btnLeft);
  		} else {
  			width = left.width;
  			
  			leftContainer.add(left);
  		}
  		
  		$.center.left = 0;
  		leftContainer.width = width;
  		leftContainer.visible = true;
  	} else {
  		$.left.visible = false;
  		$.center.left = 0;
  	}
}

function loadRightButton(right) {
	if (right) {
		var width,
			rightContainer = $.right;
			
  		if (right.callback) {
  			width = Alloy.CFG.size_44;
  			
  			var btnRight = right.icon ? createImageButton(right.icon) : createButton(right.title);
			btnRight.addEventListener('singletap', right.callback);
			rightContainer.add(btnRight);
  		} else {
  			width = right.width;
  			
  			rightContainer.add(right);
  		}
  		
  		$.center.right = 0;
  		rightContainer.width = width;
  		rightContainer.visible = true;
  		
  		if ( right.removePadding ) {
  			$.right.right = 0;
  		}
  	} else {
  		$.right.visible = false;
  		$.center.right = 0;
  	}
}

function loadTitle(title) {
	if (title) {
		if (typeof title == 'string') {
	  		$.center.add( Ti.UI.createLabel({ text: title, font: { fontSize: Alloy.CFG.size_20, fontFamily: 'AGaramondPro-Regular' }, color: '#fff', ellipsize: true, wordWrap: true }) );
	  	} else {
	  		$.center.add( title );
	  	}
	}
}