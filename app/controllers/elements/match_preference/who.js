var sexCallback;

exports.init = function(toggleSex, top) {
	sexCallback = toggleSex;
	$.wrapper.top = top;
};

exports.set = function(params) {
	params.like_gender && ($.lbTargetGender.text = params.like_gender);
	params.like_age_from && ($.ageFrom.text = params.like_age_from);
	params.like_age_to && ($.ageTo.text = params.like_age_to);
};

exports.get = function() {
	return {
		like_gender: $.lbTargetGender.text,
		like_age_from: parseInt($.ageFrom.text, 10),
		like_age_to: parseInt($.ageTo.text, 10)
	};
};

function toggleSex(e) {
  	sexCallback(e.source.children[0].text);
}