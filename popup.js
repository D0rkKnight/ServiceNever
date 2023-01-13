// HTML interface
// Get references to the input field and submit button
const responsePreview = document.getElementById('response-preview');
const caseSelect = document.getElementById('case-type-selector');

let optionSelects = [];
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
		rebuildDecisionSelector(request.data.dropdowns);
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

	const encodingSelect = document.getElementById('encoding-selector');
	encodingSelect.innerHTML = '';
	optionSelects = [];

	if (caseSelect.selectedIndex == -1) {
		console.log('Case select not built yet');
		return;
	}

	for (let i=0; i<prompts.length; i++) {
		// Create the selector and label with options
		const itemDropdown = document.createElement('select');
		itemDropdown.id = `option-${i}`;

		// Add "isn't clear option"
		const unclear = document.createElement('option');
		unclear.text = 'unclear';
		itemDropdown.add(unclear);

		for (let j=0; j<prompts[i].options.length; j++) {
			const option = document.createElement('option');
			option.text = prompts[i].options[j];
			itemDropdown.add(option);
		}

		// Append the selector and label to the form
		const div = document.createElement('div');
		div.classList += 'response-option';
		div.appendChild(itemDropdown);

		encodingSelect.appendChild(div);

		// Save dropdown to list
		optionSelects.push({
			dropdown: itemDropdown,
			id: prompts[i].label
		});

		// Set existing encoding
		if (existingDecisions.decisions[prompts[i].label] != undefined) {
			itemDropdown.selectedIndex = existingDecisions.decisions[prompts[i].label];
		}

		// Add cb to dropdown selection
		itemDropdown.addEventListener('change', function() {
			(async () => {
				makeCompileCall();
			})();
		});
	}
}

function uiToEncoding() {
	// Retrieve every dropdown and get its index
	const decisions = {};
	for (let i=0; i<optionSelects.length; i++) {
		decisions[optionSelects[i].id] = optionSelects[i].dropdown.selectedIndex;
	}

	let index = caseSelect.selectedIndex;

	return {
		scriptIndex: index,
		decisions: decisions,
	};
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