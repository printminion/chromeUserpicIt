var apiVersion = 1;
var baseUrl = 'http://userpicit.com';
var sendUrl = baseUrl + '/proxy.php?ver=' + apiVersion;
var wwwUrl = baseUrl + '/proxy.php?mehod=open&';
var resultUrl = '';

var STATUS_SUCCESS = 'success';
var STATUS_GENERAL_ERROR = 'general_error';
var STATUS_LOGIN_REQUIRED = 'login_required';

var BROWSER_CHANNEL_RETRY_INTERVAL_MS = 10000 * (1 + Math.random() - 0.5);
var req = new XMLHttpRequest();

function sendToUserpicIt(title, parentUrl, url, msgType, listener) {
	req.open('POST', sendUrl, true);
	req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	req.setRequestHeader('X-Same-Domain', 'true'); // XSRF protector

	resultUrl = wwwUrl + MD5(url);

	req.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (req.status == 200) {
				var body = req.responseText;
				var data = JSON.parse(req.responseText );

				if (data.rsp.stat == "fail") {
					// flushMessage('error',data.rsp.err.msg);
					listener(STATUS_GENERAL_ERROR);
				} else {
					chrome.tabs.create({
						url : data.rsp.redirect
					});
				}

				if (body.indexOf('OK') == 0) {
					listener(STATUS_SUCCESS);
				} else if (body.indexOf('LOGIN_REQUIRED') == 0) {
					listener(STATUS_LOGIN_REQUIRED);
				}
			} else {
				listener(STATUS_GENERAL_ERROR);
			}
		}
	};

	var data = 'method=ups.image.chromeupload&title='
			+ encodeURIComponent(title) + '&uploadUrl='
			+ encodeURIComponent(url) + '&parentUrl='
			+ encodeURIComponent(parentUrl);
	req.send(data);
}
