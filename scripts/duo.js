exports.name = 'DUO Reactivation';

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {
	let requestType = provider.get('requestType', 'select', ['Reactivation', 'Install DUO', 'Add device']);
	let out = '';

	if (requestType == 1) {
		let phoneNumber = provider.get('phone_number', 'select',
		['New phone number', 'Old phone number', 'Unknown']);

		if (phoneNumber == 1) {
			out += 'Since your new phone does not have the same phone number as your old phone, you will need to call in for a DUO reactivation.\n';
		}
		else if (phoneNumber == 2) {
			out += 'We\'ve sent a reactivation text to your phone, if you follow the instructions on the text you will be able to use DUO again.\n';
		}
		else if (phoneNumber == 3) {
			out += 'Can you let us know if your phone number has the same phone number as before or not?\n';
		}
	}
	else if (requestType == 2) {
		let device = provider.get('device', 'select', ['iPhone', 'Android', 'Other']);
		let deviceName = provider.get('deviceName', 'text');

		if (device == 1) {
			out += 'We\'ve sent you a link to download the DUO app for your iPhone. You can download the app from the link below:\n';
			out += 'https://itunes.apple.com/us/app/duo-mobile/id422663827?mt=8\n';
		}
		else if (device == 2) {
			out += 'We\'ve sent you a link to download the DUO app for your Android phone. You can download the app from the link below:\n';
			out += 'https://play.google.com/store/apps/details?id=com.duosecurity.duomobile&hl=en_US\n';
		}
		else if (device == 3) {
			out += `You can't get DUO on that.\n`;
		}
	}
	else if (requestType == 3) {
		let alreadyHasDevice = provider.get('alreadyHasDevice', 'checkbox');

		if (alreadyHasDevice) {
			out += 'You can add your device by following the steps below:\n';
			out += '1. Go to https://duo.ucsd.edu\n';
			out += '2. Click on the "Add a device" button\n';
			out += '3. Follow the instructions on the screen\n';
		}
		else {
			out += 'You will need to either call in or come to our front desk to have your device added to your account.\n';
		}
	}

	return {
		response: out,
		service: 'Access & Identity Management',
		serviceOffering: 'MultiFactor Authentication',
		assignmentGroup: 'ITS-ServiceDesk'
	};
};