exports.name = 'Health Escalation Setup';

exports.compile = function (provider) {

    // Also make sure to handle null values
    provider.call('filler');

    return {
		response: "",
		service: 'Service Notifications & External Support',
		service_offering: 'Non ITS Support',
		assignment_group: 'ITS-ServiceDesk',
	};
}