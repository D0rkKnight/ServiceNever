exports.name = 'Filler (INVISIBLE)';

exports.compile = function (provider) {

    let request = provider.case.case_type;
    
    if (provider.case.case_type == '')
        request = 'Request';
    
    console.log(provider.case);

    return {
        case_type: request
	};
}