(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var decisionCache;
var scriptCache;

// Build script listing
const glob = [{name:'duo',module:require('./scripts/duo.js')},{name:'wifi',module:require('./scripts/wifi.js')}];
const scripts = [];
for (let i=0; i<glob.length; i++) {
	scripts[i] = glob[i].module;
	scripts[i].filename = glob[i].name;
}

// Get every file in scripts


chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
	if (request.action === 'compile') {

		decisionCache = request.data.decisions;
		scriptCache = scripts[request.data.scriptIndex];

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
		let output = makeCompileCall(decisionCache, scriptCache, request.data);

		// Load in the info even if it's failure info
		chrome.runtime.sendMessage({
			action: 'sendSolution',
			data: output
		});
		
		if (!output.success)
			chrome.runtime.sendMessage({
				action: 'rebuildDropdowns',
				data: output
			});
	}

	if (request.action === 'getProblemTypes') {

		// Doing so loses script methods
		let ret = [];
		for (let i=0; i<scripts.length; i++) {
			ret.push(scripts[i].name);
		}
		sendResponse(ret);
	}

	if (request.action === 'getDecisions') {
		let scr = scripts[request.index];

		sendResponse(scr.prompts);
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
				provider.success = false;
				return null;
			}
		}
	};

	const response = script.compile(provider);
	if (!provider.success) {
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

	const solution = {
		success: true,
		customerResponse: output,
		service: response.service,
		serviceOffering: response.serviceOffering
	};

	return solution;
}
},{"./scripts/duo.js":2,"./scripts/wifi.js":3}],2:[function(require,module,exports){
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

	return {
		response: out,
		service: 'DUO ',
		serviceOffering: 'MOBILE'
	};
};
},{}],3:[function(require,module,exports){
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
