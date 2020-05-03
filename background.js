var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')
function updateRegexpes()
{
	browser.storage.local.get("regstr_allowed", function(res) {
		var  regstr = (res.regstr_allowed || defaultRgx);
		console.log(regstr);
		var regexpesarray = regstr.split("\n");
		watch_tabs  = new Set();
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