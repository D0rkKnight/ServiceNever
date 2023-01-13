var decisionCache;
var scriptCache;

// Build script listing
const glob = require('./scripts/*.js', {mode: 'list'});
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

function makeCompileCall(decisions, script, scrapedInfo) {
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

	const response = script.compile(provider);
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