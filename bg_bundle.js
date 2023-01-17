(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var decisionCache = {};
var scriptIndexCache = 0;

// Build script listing
const glob = [{name:'duo',module:require('./scripts/duo.js')},{name:'duo_call',module:require('./scripts/duo_call.js')},{name:'escalation',module:require('./scripts/escalation.js')},{name:'example',module:require('./scripts/example.js')},{name:'vpn',module:require('./scripts/vpn.js')},{name:'wifi',module:require('./scripts/wifi.js')}];
const scripts = [];
for (let i=0; i<glob.length; i++) {
	scripts[i] = glob[i].module;
	scripts[i].filename = glob[i].name;
}

// Get every file in scripts


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'compile') {

		// Write in new decisions
		for (const [key, value] of Object.entries(request.data.decisions))
			decisionCache[key] = value;

		scriptIndexCache = request.data.scriptIndex;

		// Grab the case
		chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
			if (tabs.length == 0)
			{
				console.log('No tabs found');
				return;
			}

			chrome.tabs.sendMessage(tabs[0].id, { action: 'scrapeCase' },
				function (response) { });
		});

	}
	if (request.action === 'caseRetrieved') {
		let output = makeCompileCall(decisionCache, scripts[scriptIndexCache], request.data);

		// Load in the info even if it's failure info
		chrome.runtime.sendMessage({
			action: 'sendSolution',
			data: output
		});
	
		chrome.runtime.sendMessage({
			action: 'rebuildDropdowns',
			data: output,
			decisions: decisionCache
		});
	}

	if (request.action === 'getProblemTypes') {

		// Doing so loses script methods
		let ret = [];
		for (let i=0; i<scripts.length; i++) {
			ret.push(scripts[i].name);
		}
		sendResponse(
			{
			names: ret,
			index: scriptIndexCache
		});
	}
});

function makeCompileCall(decisions, script, scrapedInfo) {
	
	// Create provider object
	let provider = {
		decisions: decisions,
		inputs: [],
		success: true,
		case: scrapedInfo,
		scripts: scripts,

		get: (label, type, data) => {

			// Default to a simple data field
			if (type == null)
				type = 'checkbox';
			
			provider.inputs.push({
				label: label,
				data: data,
				type: type
			});

			if (decisions[label] != undefined)
				return decisions[label];
			
			else {
				// Don't fail the provider, let it continue to build the output
				// provider.success = false;
				return null;
			}
		},

		call: (scriptName) => {
			// Search for the script
			for (let i=0; i<scripts.length; i++) {
				if (scripts[i].filename == scriptName) {
					return scripts[i].compile(provider);
				}
			}

			console.error(`Script ${scriptName} not found!`);
			return null;
		}
	};

	const response = script.compile(provider);
	if (!provider.success || response == null) {
		return {
			success: false,
			requiredInputs: provider.inputs,
			customerResponse: 'compilation failure, more information required'
		};
	}

	const output =
		`Hello ${scrapedInfo.Account},

Thank you for contacting us at the ITS ServiceDesk. 

${response.response}

If you have any further questions, feel free to email us at servicedesk@ucsd.edu or call us at (858) 246-4357.

Best,
Hanzen
ITS Service Desk 
servicedesk@ucsd.edu
(858) 246-4357
`;

	let solution = response;
	solution.response = output;
	solution.success = true;
	solution.requiredInputs = provider.inputs;

	return solution;
}
},{"./scripts/duo.js":2,"./scripts/duo_call.js":3,"./scripts/escalation.js":4,"./scripts/example.js":5,"./scripts/vpn.js":6,"./scripts/wifi.js":7}],2:[function(require,module,exports){
exports.name = 'DUO Reactivation';

// Takes a dict of selections and returns a valid output
// Outputs the message body and not the header or the tail
exports.compile = function (provider) {
	let requestType = provider.get('requestType', 'select', ['Reactivation', 'Install DUO', 'Add device', 'Escalation Test']);
	let out = '';

	let format = {
		response: out,
		service: 'Access & Identity Management',
		service_offering: 'MultiFactor Authentication',
		assignment_group: 'ITS-ServiceDesk'
	}

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
	else if (requestType == 4) {

		// Invoke the compile of another script!
		format = provider.call('escalation');
	}

	return format;
};
},{}],3:[function(require,module,exports){
exports.name = 'DUO Call Cleanup';

exports.compile = function (provider) {

	let contact = provider.get('Account Name', 'text');

    return {
		response: "",
		service: 'Access & Identity Management',
		service_offering: 'MultiFactor Authentication',
		assignment_group: 'ITS-ServiceDesk',
		case_type: 'Request',
		contact: contact,

        short_description: 'Duo Reactivation',
        description: provider.case.short_description
	};
}
},{}],4:[function(require,module,exports){
exports.name = 'Escalation';

exports.compile = function (provider) {

	let destination = provider.get('Escalate to', 'text');
    let out = `Your ticket has been escalated to ${destination}, who will be in contact with you shortly.`

    console.log("reached");

    return {
		response: out,
		assignment_group: destination,
	};
}
},{}],5:[function(require,module,exports){
exports.name = 'Example';

exports.compile = function (provider) {

    return {
		response: "response",
		service: 'Example service',
		service_offering: 'Example offering',
		assignment_group: 'Example group'
	};
}
},{}],6:[function(require,module,exports){
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
},{}],7:[function(require,module,exports){
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
},{}]},{},[1]);
