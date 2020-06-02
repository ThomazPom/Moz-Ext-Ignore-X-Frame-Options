var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')
function updateRegexpes()
{
	browser.storage.local.get(null, function(res) {
		var  regstr = (res.regstr_allowed || defaultRgx);
		var regexpesarray = regstr.split("\n");
		watch_tabs  = new Set();

		browser.webRequest.onBeforeRequest.removeListener(monitorBeforeRequest)
		browser.webRequest.onHeadersReceived.removeListener(setHeader)
		
		if(!res.is_disabled)
		{

			browser.webRequest.onBeforeRequest.addListener(
				monitorBeforeRequest,
				{urls : regexpesarray},[]
			);

			browser.webRequest.onHeadersReceived.addListener(
				setHeader,
				{urls :   ["<all_urls>"]},
				["blocking", "responseHeaders"]
			);

		}
	});
}

var watch_tabs  = new Set();
function monitorBeforeRequest(e) {
	watch_tabs.add(e.frameId || e.tabId)
}
function setHeader(e) {
	if(!e.frameId || !watch_tabs.has(e.parentFrameId || e.tabId))
	{
  		return {responseHeaders: e.responseHeaders};	
	}
	var headersdo = {
		"content-security-policy":(x=>{return false;}),
		"x-frame-options":(x=>{return false})
	}
	e.responseHeaders= e.responseHeaders.filter(x=>{
		var a_filter=headersdo[x.name.toLowerCase()];
		return a_filter?a_filter(x):true;
	})
	console.log(e)
  	return {responseHeaders: e.responseHeaders};
}
updateRegexpes();
var portFromCS;
function connected(p) {
	portFromCS = p;
	portFromCS.onMessage.addListener(function(m) {
			browser.storage.local.set(m,updateRegexpes);
	});
}
browser.runtime.onConnect.addListener(connected);
console.log("LOADED");