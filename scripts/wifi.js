exports.name = 'Network Connectivity';

exports.compile = function (provider) {
	
	let response = '';
	let infoBloc = 'In order for us to assist you, please provide the following information:\n\n';
	let out = {
		response: response,
		service: 'Network Connectivity',
		serviceOffering: 'Campus Wireless Networking'
	}

	let location = provider.get('Location', 'select', ['Campus', 'Health', 'Off Campus']);
	let networkPool = [];

	if (location == 0) {
		infoBloc += 'The location you are trying to connect through\n';
	}

	let compromised = provider.get('Compromised', 'checkbox');
	if (compromised) {
		response += 'Your device has been compromised.';

		// Insert compromised device procedure
	}

	let firstTimeLogin = provider.get('First Time Login', 'checkbox');

	if (firstTimeLogin) {
		// AD login formatting reminder
		response += 'Please make sure you are using the correct username and password. Your username ought to be your UCSD AD username and your password your AD password.\n';
	}

	// Query available networks
	if (location == 1) {
		networkPool = ['UCSD', 'UCSD Guest', 'Resnet Protected', 'Resnet Guest-Device'];
	}
	if (location == 2) {
		networkPool = ['UCSD Health', 'UCSD Health Guest'];
	} else 
		networkPool = ['UCSD', 'UCSD Guest', 'Resnet Protected', 'Resnet Guest-Device', 'UCSD Health', 'UCSD Health Guest'];

	// Get connected network
	let networkStatus = [];
	for (let i = 0; i < networkPool.length; i++) {
		networkStatus.push(provider.get('signal-on'+networkPool[i], 'select', ['Connected', 'Disconnected']));
	}

	// Solution dump
	let solution = 'To troubleshoot your wifi problem, you can begin by referring to this document: <INSERT DOCUMENT LINK>\n\n';
	solution += 'Please try the following steps:\n\n';

	let restarted = provider.get('Restarted', 'checkbox');
	if (!restarted) {
		solution += 'Restart your device.\n';
	}

	let device = provider.get('Device', 'select', ['MacOS', 'Windows', 'iOS', 'Android']);
	if (device == 0)
		infoBloc += 'The device you are using (Mac, Windows, Android, etc.)\n';

	if (device == 1) {
		// MacOS troubleshooting

		let macosVersion = provider.get('MacOS Version', 'select', ['10.14', '10.15', '10.16']);
		if (macosVersion == 0)
			infoBloc += 'The version of MacOS you are using\n';
		
		// Link last resort mac doc
		solution += 'If the above steps do not work, please refer to this document: <INSERT DOCUMENT LINK>\n';
	}

	if (device == 1) {
		// Windows troubleshooting

		let windowsVersion = provider.get('Windows Version', 'select', ['7', '8', '10', '11']);
		if (windowsVersion == 0)
			infoBloc += 'The version of Windows you are using\n';

		// Link last resort windows doc
		solution += 'If the above steps do not work, please refer to this document: <INSERT DOCUMENT LINK>\n';
	}

	

	response += solution;
	out.response = response;
	return out;

};