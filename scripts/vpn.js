// For issues connecting to the UCSD / Health VPN

exports.name = 'VPN';

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {

    let campus = provider.get('campus', 'select', ['UCSD', 'UCSD Health']);
    let device = provider.get('device', 'select', ['MacOS', 'Windows', 'iOS', 'Android']);
    let domainName;

    out = 'For issues connecting to the UCSD / Health VPN, please follow the steps below:\n\n';

    if (campus == 1) {
        out += 'You can refer to this document for more information: https://blink.ucsd.edu/technology/network/connections/off-campus/VPN/\n'

        domainName = 'vpn.ucsd.edu';
    }
    else if (campus == 2) {
        out += 'You can refer to this document for more information: -insert health vpn guide-\n'
        
        domainName = 'ucsdh-vpn.ucsd.edu';
    } else
        provider.success = false;

    let failureReason = provider.get('stageReached', 'select', 
        ['Can\'t find domain', 'Login failure', 'Laggy']
        );
    
    if (failureReason == 1) {
        out += 'Make sure you are using the correct domain name. If you are using the wrong domain name, you will be unable to connect to the VPN.\n';
        out += `The correct domain name is: ${domainName}\n`;
    }

    if (failureReason == 2) {
        out += 'Make sure you are using the correct username and password. If you are using the wrong username and password, you will be unable to connect to the VPN.\n';
        out += 'Your username should be your UCSD username.\n'
        out += 'Your password should be your UCSD password.\n'

        let duoAccepted = provider.get('duoAccepted', 'checkbox');
        if (!duoAccepted) {
            out += 'Logging in requires a DUO authentication. We see that you are being sent DUO push requests, but you are not accepting the push requests. If you are not receiving those push requests or are unable to accept them, please let us know.\n';
        }
    }

	return {
		response: out,
		service: 'DUO ',
		serviceOffering: 'MOBILE',
		assignmentGroup: 'ITS Service Desk'
	};
};