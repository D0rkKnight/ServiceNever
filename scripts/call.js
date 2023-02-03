// Takes call info and links into a regular ticket resolver

exports.name = 'Call';

exports.compile = function (provider) {

	let contact = provider.get('Account Name', 'text');

    // Retrieve the base ticket
    // Collect script types first
    let scripts = [];
    for (let script of provider.scripts) {
        scripts.push(script.name);
    }

    let base = provider.get('Base Ticket', 'select', scripts);
    if (base == null)
        return null;

    let baseOutput = provider.call(base);

    return {
		response: "",
		service: 'Access & Identity Management',
		service_offering: 'MultiFactor Authentication',
		assignment_group: 'ITS-ServiceDesk',
		case_type: 'Request',
		contact: contact,

        short_description: 'Zoom Call',
        description: provider.case.short_description
	};
}