exports.name = 'Network Connectivity';

var responses = {
	'network': [
		'unknown',
		'UCSD Protected',
		'UCSD Guest',
		'Resnet Protected',
		'Resnet Guest Device'
	],
	'device': [
		'unknown',
		'Mac',
		'Windows',
		'Linux',
		'Android',
		'iOS',
		'Other'
	]
};

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {
	let network = provider.get('network', 
		['UCSD Protected', 'UCSD Guest', 'Resnet Protected', 'Resnet Guest Device']);
	let device = provider.get('device', 
		['Mac', 'Windows', 'Linux', 'Android', 'iOS', 'Other']);

	let out = 
    `Your network is ${responses['network'][network]}\nYour device is ${responses['device'][device]}`;

	if (network == 0) {
		let violence = provider.get('violence', ['Yes', 'No']);

		if (violence == 1) {
			out += 'what kind of dumbass writes a ticket without even providing the appropriate information you worthless piece of shit';
		} else {
			out += 'please send us the network you are struggling with';
		}
	}

	return {
        response: out,
        service: 'Network Connectivity',
        serviceOffering: 'Campus Wireless Networking'
    };

};