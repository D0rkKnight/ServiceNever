(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
var decisionCache;
var scriptCache;

// Build script listing
const glob = [{name:'duo',module:require('./scripts/duo.js')}];
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
		let output = compile(decisionCache, scriptCache, request.data);
		console.log(output);
		
		if (output.success)
			chrome.runtime.sendMessage({
				action: 'sendSolution',
				data: output
			});
		
		else
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

function compile(decisions, script, scrapedInfo) {
	console.log(decisions);

	// Create provider object
	let provider = {
		decisions: decisions,
		dropdowns: [],
		success: true,

		get: (label, options) => {
			provider.dropdowns.push({
				label: label,
				options: options
			});

			if (decisions[label] != undefined)
				return decisions[label];
			
			else {
				provider.success = false;
				return null;
			}
		}
	};

	const responseText = script.compile(provider);
	if (!provider.success) {
		console.log('compilation failure, more information required');

		return {
			success: false,
			dropdowns: provider.dropdowns
		};
	}

	const output =
		`Hello ${scrapedInfo.Account},

Thank you for contacting us at the ITS ServiceDesk. 

${responseText}

If you have any further questions, feel free to email us at servicedesk@ucsd.edu or call us at (858) 246-4357.

Best,
Hanzen
ITS Service Desk 
servicedesk@ucsd.edu
(858) 246-4357
`;

	const solution = {
		success: true,
		customerResponse: output
	};

	return solution;
}
},{"./scripts/duo.js":2}],2:[function(require,module,exports){
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
},{}]},{},[1]);
