// HTML interface
// Get references to the input field and submit button
const responsePreview = document.getElementById('response-preview');
const caseSelect = document.getElementById('case-type-selector');

let optionSelects = [];
let optionCache = {}; // Contains old input objects
let solution = null;

// Retrieve scripts
chrome.runtime.sendMessage({ action: 'getProblemTypes' }, function (response) 
{
	// Write data into ui
	rebuildCaseTypeSelector(response);

	chrome.runtime.sendMessage({ action: 'getDecisions', index: caseSelect.selectedIndex}, function (response) {
		// Make a raw compile request to get initial batch info
		makeCompileCall();
	});
});

chrome.runtime.onMessage.addListener(async function(request) {
	if (request.action === 'sendSolution') {
		// Write in data
		solution = request.data;
		displaySolutionData();
	}
	if (request.action === 'rebuildDropdowns') {
		rebuildDecisionSelector(request.data.requiredInputs);
	}
});

// On dropdown change, rebuild encoding selector
document.getElementById('case-type-selector').addEventListener('change', function() {

	// Zero out decision selector
	rebuildDecisionSelector([]);

	// Force a compile
	makeCompileCall();
});

// Write to case button
document.getElementById('write-to-case-button').addEventListener('click', function() {

	chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
		chrome.tabs.sendMessage(tabs[0].id, {action: 'writeToCase', data: solution}, 
			function(response) {});  
	});
});

function rebuildCaseTypeSelector(types) {
	// Build problem listing
	caseSelect.innerHTML = '';
	for (let i=0; i<types.length; i++) {
		const option = document.createElement('option');
		option.text = types[i];
		caseSelect.add(option);
	}
}

// Initializes to null
function rebuildDecisionSelector(prompts) {

	// Collect existing encodings
	let existingDecisions = uiToEncoding();
	
	console.log(prompts);
	console.log(existingDecisions);

	// Store existing options into cache
	for (let i=0; i<optionSelects.length; i++)
		optionCache[optionSelects[i].id] = optionSelects[i];

	const encodingSelect = document.getElementById('encoding-selector');
	encodingSelect.innerHTML = '';
	optionSelects = [];

	if (caseSelect.selectedIndex == -1) {
		console.log('Case select not built yet');
		return;
	}

	for (let i=0; i<prompts.length; i++) {
		let prompt = prompts[i];

		// Create the selector and label with options
		let inputElement;

		// If the cache already contains this, just revive the cache.
		let cache = optionCache[prompt.label];
		if (cache != undefined && cache.type == prompt.type)
			inputElement = optionCache[prompt.label].inputElement;
		
		// Otherwise, generate a new element
		else switch (prompt.type) {
			case 'select':
				inputElement = document.createElement('select');

				// Add "isn't clear option"
				const unclear = document.createElement('option');
				unclear.text = 'unclear';
				inputElement.add(unclear);

				for (let j=0; j<prompts[i].data.length; j++) {
					const option = document.createElement('option');
					option.text = prompts[i].data[j];
					inputElement.add(option);
				}
				break;
			default:
				// Doesn't need options, just leave it be.
				inputElement = document.createElement('input');
				inputElement.type = prompt.type;
				break;
		}
		
		inputElement.id = `option-${i}`;

		// Append the selector and label to the form
		const div = document.createElement('div');
		div.classList += 'response-option';
		div.appendChild(inputElement);

		encodingSelect.appendChild(div);

		// Save element to list
		// If the element is cached, it will get reconstructed here, but that reconstruction should be safe.
		optionSelects.push({
			inputElement: inputElement,
			id: prompts[i].label,
			type: prompts[i].type
		});

		// Add cb to dropdown selection
		inputElement.addEventListener('change', function() {
			(async () => {
				makeCompileCall();
			})();
		});
	}
}

function uiToEncoding() {
	// Retrieve every dropdown and get its index
	const decisions = {};

	for (let i=0; i<optionCache.length; i++) {
		// Load in cached values and assume to be valid
		decisions[optionCache[i].id] = valFromInputObject(optionCache[i]);
	}

	for (let i=0; i<optionSelects.length; i++) {
		decisions[optionSelects[i].id] = valFromInputObject(optionSelects[i]);
	}

	console.log(decisions);

	let index = caseSelect.selectedIndex;

	return {
		scriptIndex: index,
		decisions: decisions,
	};
}

function valFromInputObject(obj) {
	element = obj.inputElement;

	switch (obj.type) {
		case 'select':
			return element.selectedIndex;
		case 'checkbox':
			return element.checked;
		default:
			return element.value;
	}
}

function makeCompileCall() {
	chrome.runtime.sendMessage(
		{
			action: 'compile',
			data: uiToEncoding(),
		},
	);
}

function displaySolutionData() {
	responsePreview.innerHTML = solution.customerResponse;
}