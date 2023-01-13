exports.name = 'DUO Reactivation';

var prompts = [
	{
		label: 'phone_number',
		type: 'selector',
		options: ['New phone number', 'Old phone number', 'Unknown']
	}
];

var responses = {
	'phone_number': [
		'Since your new phone does not have the same phone number as your old phone, you will need to call in for a DUO reactivation.',
		'We\'ve sent a reactivation text to your phone, if you follow the instructions on the text you will be able to use DUO again.',
		'Can you let us know if your phone number has the same phone number as before or not?'
	]
};

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {
	let phoneNumber = provider.get('phone_number', prompts[0].options);
	let eggman = provider.get('eggman', ['yes', 'no']);

	let out = responses['phone_number'][phoneNumber];

	console.log(eggman);
	if (eggman == 1)
		out += 'i am the eggman';
    else
        provider.success = false;

	return out;

};