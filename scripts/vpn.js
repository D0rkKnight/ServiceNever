// For issues connecting to the UCSD / Health VPN

exports.name = 'VPN';

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {
    let campus = provider.get('campus', 'select', ['UCSD', 'UCSD Health']);
    let device = provider.get('device', 'select', ['MacOS', 'Windows', 'iOS', 'Android']);

    let stageReached = provider.get('stageReached', 'select', ['Connected to VPN', 'DUO authenticated']);
    let issue = provider.get('issue', 'select', ['Can\'t connect to VPN', 'Laggy connection']);

    let duoPushesGoingThru = provider.get('duoPushesGoingThru', 'checkbox');

    out = 'For issues connecting to the UCSD / Health VPN, please follow the steps below:\n\n';

    if (campus == 1) {
        out += '1. Go to https://vpn.ucsd.edu\n';
        out += 'You can refer to this document for more information: https://blink.ucsd.edu/technology/network/connections/off-campus/VPN/\n'
    }
    else if (campus == 2) {
        out += '1. Go to https://vpn.ucsdhealth.edu\n';
        out += 'You can refer to this document for more information: -insert health vpn guide-\n'
    } else
        provider.success = false;
    
    if (duoPushesGoingThru) {
        let duoPushBeingReceived = provider.get('duoPushBeingReceived', 'checkbox');
        if (!duoPushBeingReceived) {
            out += '2. Make sure you have the DUO app installed on your device and you are accepting the duo pushes when they come through\n';
        }
    }

    if (issue == 1) {
        let stageFailed = provider.get('stageFailed', 'select', ['Domain selection', 'Credentials input']);

        if (stageFailed == 0)
            out += 'Let us know which stage you are struggling to connect to the VPN with\n';

        if (stageFailed == 1)
            out += '2. Make sure you are selecting the correct domain\n';
        
        if (stageFailed == 2)
            out += '2. Make sure you are entering the correct username and password\n';
        
    }

	return {
		response: out,
		service: 'DUO ',
		serviceOffering: 'MOBILE',
		assignmentGroup: 'ITS Service Desk'
	};
};