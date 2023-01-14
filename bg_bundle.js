(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var decisionCache = {};
var scriptIndexCache = 0;

// Build script listing
const glob = [{name:'duo',module:require('./scripts/duo.js')},{name:'vpn',module:require('./scripts/vpn.js')},{name:'wifi',module:require('./scripts/wifi.js')}];
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
	solution.customerResponse = output;
	solution.success = true;
	solution.requiredInputs = provider.inputs;

	return solution;
}
},{"./scripts/duo.js":2,"./scripts/vpn.js":3,"./scripts/wifi.js":4}],2:[function(require,module,exports){
exports.name = 'DUO Reactivation';

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
	let phoneNumber = provider.get('phone_number', 'select',
		['New phone number', 'Old phone number', 'Unknown']);

	let out = responses['phone_number'][phoneNumber];

	if (phoneNumber == 1) {
		out += '\n you have a new phone number';

		let bagel = provider.get('bagel', 'select', ['Bagel', 'No Bagel', 'Cream cheese bagel']);
	} else {
		provider.success = false;
	}

	let checkbox = provider.get('yesno', 'checkbox');
	let input = provider.get('input', 'text');

	out += '\n' + checkbox + '\n' + input;

	return {
		response: out,
		service: 'DUO ',
		serviceOffering: 'MOBILE',
		assignmentGroup: 'ITS Service Desk'
	};
};
},{}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}]},{},[1]);
