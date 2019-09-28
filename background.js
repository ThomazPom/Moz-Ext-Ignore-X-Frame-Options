var defaultRgx =  ["<all_urls>"].join('\n')
function updateRegexpes()
{
	browser.storage.local.get("regstr", function(res) {
		var  regstr = (res.regstr || defaultRgx);
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

	if(watch_tabs.includes(e.tabId) || e.frameId)
	{
		return;
	}
	watch_tabs.push(e.tabId)
}
function setHeader(e) {
	if(!e.frameId && !watch_tabs.includes(e.tabId))
	{
  		return {responseHeaders: e.responseHeaders};	
	}
	var headersdelete = ["content-security-policy","x-frame-options"]
	var cspval="";
	e.responseHeaders= e.responseHeaders.filter(x=>{
		var lowername = x.name.toLowerCase();
		cspval = lowername === headersdelete[0]?x.value:cspval
		return !headersdelete.includes(lowername)
	})
	//e.responseHeaders.push({
	//	name: "x-frame-options",
	//	value: "ALLOW"
	//});
	e.responseHeaders.push({
		name: "content-security-policy",
		value: cspval.includes("frame-ancestors")?
			cspval.replace(/frame-ancestors[^;]*;?/, "frame-ancestors *;")
				:
			"frame-ancestors *;"+cspval
  	}); 	
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
					"regstr":m.updateRegexpes,
				}
			);
		}		
	});
}
browser.runtime.onConnect.addListener(connected);