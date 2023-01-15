// if (location.hostname === "support.ucsd.edu") {
//     if (document.readyState !== 'complete')
//         window.addEventListener("load", parseCase)
//     else
//         parseCase()
// }

// Link to event system
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.action === 'writeToCase') {
		const solution = request.data;
		autofillCase(solution);
	}
	if (request.action === 'scrapeCase') {
		chrome.runtime.sendMessage({action: 'caseRetrieved',
			data: scrapeCase()});
		
		return;
	}
});

function scrapeCase() {
	let fields = getCaseFields();
	let scrapedInfo = {};

	// Go thru every element in fields and scrape its value
	for (let [key, value] of Object.entries(fields)) {
		scrapedInfo[key] = value.value;
	}

	return scrapedInfo;
}

// Data is expected to be in the given format
async function autofillCase(data) {
	let fields = getCaseFields();

	// Go thru every element in fields and autofill it
	for (let [key, value] of Object.entries(fields)) {
		if (data[key] === undefined)
			continue;

		if (key === 'case_type') {
			// Find the index of the case type
			let index = -1;
			for (let i=0; i<value.options.length; i++) {
				if (value.options[i].value === data[key]) {
					index = i;
					break;
				}
			}
			if (index === -1)
				continue;

			value.selectedIndex = index;
			continue;
		}
			

		if (data[key] !== undefined)
			value.value = data[key];
	}

}

function getDoc() {
	const iframe = document.getElementById('gsft_main');
	let doc = iframe.contentWindow.document;

	return doc;
}

function getCaseFields() {
	let doc = getDoc();

	let fields = {
		case_num: doc.getElementById('sys_readonly.sn_customerservice_case.number'),
		account: doc.getElementById('sn_customerservice_case.account_label'),
		contact: doc.getElementById('sys_display.sn_customerservice_case.contact'),
		email: doc.getElementById('sys_readonly.sn_customerservice_case.u_contact_email_address'),
		case_type: doc.getElementById('sn_customerservice_case.u_case_type'),
		priority: doc.getElementById('sn_customerservice_case.priority'),
		response: doc.getElementById('activity-stream-comments-textarea'),
		service_offering: doc.getElementById('sys_display.sn_customerservice_case.service_offering'),
		service: doc.getElementById('sys_display.sn_customerservice_case.business_service'),
		assignment_group: doc.getElementById('sys_display.sn_customerservice_case.assignment_group'),
		description: doc.getElementById('sn_customerservice_case.description'),
		short_description: doc.getElementById('sn_customerservice_case.short_description')
	}

	return fields;
}