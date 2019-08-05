var defaultRgx =  ["http://*/*", "https://*/*"].join('\n')
var defaultRgx_fancestor =  ["http://*", "https://*","file://*"].join('\n')

function updateRegexpes()
{
	browser.storage.local.get("regstr_fancestor", function(res) {
		regstr_fancestor = (res.regstr_fancestor || defaultRgx_fancestor).split("\n").join(" ");
	});
	browser.storage.local.get("regstr", function(res) {
		var  regstr = (res.regstr || defaultRgx);
		var regexpesarray = regstr.split("\n");
		browser.webRequest.onHeadersReceived.removeListener(setHeader)
		browser.webRequest.onHeadersReceived.addListener(
			setHeader,
			{urls : regexpesarray},
			["blocking", "responseHeaders"]
		);
	});
}
function setHeader(e) {
	var headersdelete = ["content-security-policy","x-frame-options"]
	var cspval="";
	e.responseHeaders= e.responseHeaders.filter(x=>{
		var lowername = x.name.toLowerCase();
		cspval = lowername === headersdelete[0]?x.value:cspval
		return !headersdelete.includes(lowername)
	})
	e.responseHeaders.push({
		name: "x-frame-options",
		value: "ALLOW"
	});
	e.responseHeaders.push({
		name: "content-security-policy",
		value: cspval.includes("frame-ancestors")?
			cspval.replace(/frame-ancestors[^;]*;?/, "frame-ancestors "+regstr_fancestor+";")
				:
			"frame-ancestors "+regstr_fancestor+";"+cspval
  	}); 	
  	return {responseHeaders: e.responseHeaders};
}
// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
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
				},
				()=>{
					browser.storage.local.set(
					{
						"regstr_fancestor":m.updateRegexpes_fancestor
					},updateRegexpes);		
				}
			);
		}		
	});
}
browser.runtime.onConnect.addListener(connected);
