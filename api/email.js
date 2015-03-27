app.get('/emails', function (req, res) {
    var api_key = config.mailgun.api_key;
    var domain = config.mailgun.domain;

    var mailgun = require('mailgun-js')({
        apiKey: api_key,
        domain: domain
    });

    var email_address = req.query.email_address;
    if (!email_address) parameterMissing('Email address', req, res);

    var pattern = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    var isValidEmail = pattern.test(email_address);
    if (!isValidEmail) handleError('Email Address', req, res, {
        status: 400,
        response: 'Email address is not valid'
    });

    var date = req.query.date;
    if (!date) parameterMissing('Date', req, res);

    var pattern =/^([0-9]{4})\-([0-9]{2})\-([0-9]{2})$/;
    var isDateValid = pattern.test(date);
    if (!isDateValid) handleError('Date', req, res, {
        status: 400,
        response: 'Date is not valid, follow yyyy-mm-dd format'
    });


    var begin = new Date(date + ' 00:00:00').getTime() / 1000;
    var end = new Date(date + ' 23:59:59').getTime() / 1000;

    var limit = req.query.limit || 25;

    function getPrettyReason(email) {
        var reason = '';
        if (email.reason === 'espblock') reason = 'ESP throttling by user\'s email provider';
        else if (email['delivery-status'] && email['delivery-status'].message) reason = email['delivery-status'].message;
        else if (email['delivery-status'] && email['delivery-status'].description) reason = email['delivery-status'].description;
        else if (email.event === 'complained') reason = 'User reported spam';
        else reason = email.reason;
        if (email['delivery-status'] && email['delivery-status']['retry-seconds']) {
            reason += '; Retrying in ' + email['delivery-status']['retry-seconds'] + ' seconds';
        }
        return reason;
    }

    mailgun.get('/practo.net/events', {
        begin: begin,
        end: end,
        ascending: 'yes',
        limit: limit,
        pretty: 'yes',
        recipient: email_address
    }, function (error, body) {
        if (error) {
            var data = {
                status: 500,
            }
            console.log(error);
            handleError('Emails', req, res, data);
        } else {
            var rawemails = body.items;
            var emails = [];
            for (var i in rawemails) {
                var rawemail = rawemails[i];
                var email = {
                    type:       rawemail.tags[0],
                    target:     rawemail['user-variables'].target,
                    status:     rawemail.event,
                    subject:    rawemail.message.headers.subject,
                    time:       new Date(rawemail.timestamp * 1000),
                    log_level:  rawemail['log-level'],
                };
                if (email.log_level !== 'info'){
                    email.delivery_status = rawemail['delivery-status'];
                    email.reason = getPrettyReason(rawemail);
                }
                emails.push(email);
            }
            res.send(emails);
        }
    });

});

