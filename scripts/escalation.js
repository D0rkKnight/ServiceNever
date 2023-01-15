exports.name = 'Escalation';

exports.compile = function (provider) {

	let destination = provider.get('Escalate to', 'text');
    let out = `Your ticket has been escalated to ${destination}, who will be in contact with you shortly.`

    console.log("reached");

    return {
		response: out,
		assignment_group: destination,
	};
}