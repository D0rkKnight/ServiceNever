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
	rebuildCaseTypeSelector(response.names);
	caseSelect.selectedIndex = response.index;

	makeCompileCall();
});

chrome.runtime.onMessage.addListener(async function(request) {
	if (request.action === 'sendSolution') {
		// Write in data
		solution = request.data;
		displaySolutionData();
	}
	if (request.action === 'rebuildDropdowns') {
		rebuildDecisionSelector(request.data.requiredInputs, request.decisions);
	}
});

// On dropdown change, rebuild encoding selector
document.getElementById('case-type-selector').addEventListener('change', function() {

	// Force a compile which will also refresh the decision selector
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
function rebuildDecisionSelector(prompts, previousData) {

	console.log(previousData);

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
		let prev = previousData[prompts[i].label];
		
		// Generate a new element
		switch (prompt.type) {
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

				if (prev !== undefined)
					inputElement.selectedIndex = prev;

				break;
			default:
				// Doesn't need options, just leave it be.
				inputElement = document.createElement('input');
				inputElement.type = prompt.type;

				if (prev !== undefined)
					inputElement.value = prev;
				break;
		}
		
		inputElement.id = `option-${i}`;

		// Create label for input element
		const label = document.createElement('label');
		label.innerHTML = prompts[i].label;

		// Append the selector and label to the form
		const div = document.createElement('div');
		div.classList += 'response-option';
		div.appendChild(label);
		div.appendChild(inputElement);

		encodingSelect.appendChild(div);

		// Save element to list
		// If the element is cached, it will get reconstructed here, but that reconstruction should be safe.
		optionSelects.push({
			inputElement: inputElement,
			id: prompts[i].label,
			type: prompts[i].type
		});

		// Write to the input element if there is previous data

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

	for (let i=0; i<optionSelects.length; i++) {
		decisions[optionSelects[i].id] = valFromInputObject(optionSelects[i]);
	}

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