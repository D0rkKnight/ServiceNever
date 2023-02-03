exports.name = 'Zoom Call';

exports.compile = function (provider) {

	let contact = provider.get('Account Name', 'text');

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