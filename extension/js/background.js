var menuId = null;
var pageInfo = null;
var tabs = new Object();

chrome.browserAction.setBadgeBackgroundColor({
	color : [ 164, 198, 57, 255 ]
});

if (chrome.contextMenus) {
	showContextMenu();
}

chrome.browserAction.onClicked.addListener(onClickedActon);

function onClickedActon(tab) {

	if (tabs.hasOwnProperty(tab.id)) {

		chrome.browserAction.setBadgeText({
			text : "",
			tabId : tab.id
		});
		chrome.browserAction.setTitle({
			title : "sniff for background images",
			tabId : tab.id
		});

		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {
				msg : "mousemove_off"
			});
		});

		delete tabs[tab.id];

	} else {
		tabs[tab.id] = true;
		chrome.browserAction.setBadgeText({
			text : "sniff",
			tabId : tab.id
		});
		chrome.browserAction.setTitle({
			title : "turn off sniff for background images",
			tabId : tab.id
		});

		chrome.tabs.getSelected(null, function(tab) {
			chrome.tabs.sendRequest(tab.id, {
				msg : "mousemove_on"
			});
		});

	}

}

chrome.extension.onConnect.addListener(function(port) {
	var tab = port.sender.tab;
	port.onMessage.addListener(function(obj) {
		console.log(obj);
		switch (obj.msg) {
		case "got_picture":
			pageInfo = obj.pageInfo;
			showExtendedContextMenu();
			break;
		case "no_picture":
			removeContextMenu();
			break;
		}
	});
});

function onClickHandler(info, tab) {

	var url = info.srcUrl;
	if (url == undefined)
		url = info.linkUrl;
	if (url == undefined)
		url = pageInfo.imageUrl;// tab.url;

	var msgType = info.mediaType;
	if (msgType == undefined) {
		msgType = 'page';
	}

	var bg = chrome.extension.getBackgroundPage();
	bg.sendToUserpicIt(tab.title, tab.url, url, msgType, function(status) {
		if (status == STATUS_LOGIN_REQUIRED) {
			chrome.tabs.create({
				url : signInUrl
			});
		} else if (status == STATUS_SUCCESS) {
			chrome.tabs.create({
				url : resultUrl
			});
		}
	});
}

function showContextMenu() {
	removeContextMenu();

	menuId = chrome.contextMenus.create({
		'title' : chrome.i18n.getMessage('app_name_short'),
		'documentUrlPatterns' : [ 'http://*/*', 'https://*/*' ],
		'onclick' : onClickHandler,
		'contexts' : [ 'image' ]
	});
}

function showExtendedContextMenu() {
	removeContextMenu();

	menuId = chrome.contextMenus.create({
		'title' : chrome.i18n.getMessage('app_name_short'),
		'documentUrlPatterns' : [ 'http://*/*', 'https://*/*' ],
		'onclick' : onClickHandler,
		'contexts' : [ 'page', 'image' ]
	});
}

function removeContextMenu() {
	if (menuId != null) {
		chrome.contextMenus.remove(menuId);
		menuId = null;
	}
}