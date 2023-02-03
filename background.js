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

				// Make a GPT call here (force write to cache)
				if (type == 'select') {
					// Just lock the damn thread until it's done
					// categorizerRequest(scrapedInfo, data, label);
				}

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
		`Hello,

Thank you for contacting us at the ITS ServiceDesk. ${response.response} If you have any further questions, feel free to email us at servicedesk@ucsd.edu or call us at (858) 246-4357.

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



// AI Autoresolution layer
async function gptRequest(input) {
	// GPT model
	const apiKey = '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';
	const model = 'text-davinci-003';

	// const response = await fetch(
	// 	'https://api.openai.com/v1/completions',
	// 	{
	// 		method: 'POST',
	// 		headers: {
	// 			'Content-Type': 'application/json',
	// 			'Authorization': `Bearer ${apiKey}`,
	// 		},
	// 		body: JSON.stringify({
	// 			'model': model,
	// 			'prompt': input,
	// 			'temperature': 0,
	// 			'max_tokens': 1000,
	// 		}),
	// 	},
	// );

	// return await response.json();
}

// // Start inclusive end exclusive
// async function categorizerRequest(caseToStr, prompt, label) {
// 	let logic = '';

// 	logic += 'Select one and only one option from below:\n';
// 	logic += '  0: if the answer is unclear\n';

// 	// Build instructions
// 	for (let j=0; j<prompt.options.length; j++) {
// 		logic += `  ${j+1} if: ${prompt.options[j]}\n`;
// 	}

// 	logic += '\n\n';

// 	const input =
// `Hi ChatGPT! ${problem.prompt}

// The case information is as follows:
//     ${caseToStr}

// Existing correspondence are in sequence from oldest to newest as follows:
//     N/A

// The format of your response will be a number.
// Base your response on the information given in the case.
    
// ${logic}
// `;

// 	const data = await gptRequest(input);

// 	const output = data.choices[0].text;

// 	// Convert to int
// 	const tokenizedEncoding = parseInt(output);
	
// 	console.log(tokenizedEncoding);

// 	// Write to decision cache and force a recompile
// 	decisionCache[label] = prompt.options[tokenizedEncoding];
// 	chrome.runtime.sendMessage({action: "writeDropdown", 
// 		data: {label: label, value: tokenizedEncoding}});
// }