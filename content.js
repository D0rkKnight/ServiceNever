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
	let doc = getDoc();

	// Scrape information from case
	let scrapedInfo = {
		'Case Number': doc.getElementById('sys_readonly.sn_customerservice_case.number').value,
		'Account': doc.getElementById('sn_customerservice_case.account_label').value,
		'Email': doc.getElementById('sys_readonly.sn_customerservice_case.u_contact_email_address').value,
		'Case Type': doc.getElementById('sn_customerservice_case.u_case_type').value,
		'Priority': doc.getElementById('sn_customerservice_case.priority').value,
		'Short Description': doc.getElementById('sn_customerservice_case.short_description').value,
		'Description': `\\"${doc.getElementById('sn_customerservice_case.description').value}\\"`,
	};

	return scrapedInfo;
}

async function autofillCase(data) {
	let doc = getDoc();

	const responseBox = doc.getElementById('activity-stream-textarea');
	const serviceOffering = doc.getElementById('sys_display.sn_customerservice_case.service_offering');
	const service = doc.getElementById('sys_display.sn_customerservice_case.business_service');

	if (data.customerResponse != null)
		responseBox.value = data.customerResponse;
	if (data.serviceOffering != null)
		serviceOffering.value = data.serviceOffering;
	if (data.service != null)
		service.value = data.service;
}

function getDoc() {
	const iframe = document.getElementById('gsft_main');
	let doc = iframe.contentWindow.document;

	return doc;
}