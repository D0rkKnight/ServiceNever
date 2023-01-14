var decisionCache = {};
var scriptIndexCache = 0;

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