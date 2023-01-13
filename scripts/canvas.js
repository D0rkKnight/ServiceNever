exports.name = 'Canvas Courses Gone';

var responses = {
	'recency': [
		'The issue is recent',
        'The issue is not recent'
	]
};

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {
	let recency = provider.get('recency', 
		['Recent', 'Not recent']);

	let out = responses['recency'][recency];

	return out;

};