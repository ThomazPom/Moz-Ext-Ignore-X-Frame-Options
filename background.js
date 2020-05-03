var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')
function updateRegexpes()
{
	browser.storage.local.get("regstr_allowed", function(res) {
		var  regstr = (res.regstr_allowed || defaultRgx);
		var regexpesarray = regstr.split("\n");
		watch_tabs  = []
		browser.webRequest.onBeforeRequest.removeListener(monitorBeforeRequest)
		browser.webRequest.onBeforeRequest.addListener(
			monitorBeforeRequest,
			{urls : regexpesarray},[]
		);

		browser.webRequest.onHeadersReceived.addListener(
			setHeader,
			{urls :   ["<all_urls>"]},
			["blocking", "responseHeaders"]
		);
	});
}

var watch_tabs  = []
function monitorBeforeRequest(e) {

	if(watch_tabs.includes(e.tabId) || watch_tabs.includes(e.frameId) )
	{
//		console.log(1,e.frameId,e.tabId,watch_tabs,e.url,e.originUrl)
			return;
	}
	watch_tabs.push(e.frameId || e.tabId)
}
function setHeader(e) {
	if(!e.frameId || !watch_tabs.includes(e.parentFrameId || e.tabId))
	{
//		console.log(2,e.frameId,e.tabId,e.parentFrameId,watch_tabs,e.url,e.originUrl)
  		return {responseHeaders: e.responseHeaders};	
	}

		console.log(3,e.frameId,e.tabId,watch_tabs)
	var headersdo = {
		"content-security-policy":(x=>{
			x.value = x.value.includes("frame-ancestors")?
			x.value.replace(/frame-ancestors[^;]*;?/, "frame-ancestors *;")
			:"frame-ancestors *;"+x.value
			return true;
		}),
		"x-frame-options":(x=>{return false})
	}
	e.responseHeaders= e.responseHeaders.filter(x=>{
		var a_filter=headersdo[x.name.toLowerCase()];
		return a_filter?a_filter(x):true;
	})
  	return {responseHeaders: e.responseHeaders};
}
updateRegexpes();
var portFromCS;
function connected(p) {
	portFromCS = p;
	portFromCS.onMessage.addListener(function(m) {
		if(m.updateRegexpes)
		{
			browser.storage.local.set(
				{
					"regstr_allowed":m.updateRegexpes,
				}
				,updateRegexpes // callback
			);
		}		
	});
}
browser.runtime.onConnect.addListener(connected);
console.log("LOADED");