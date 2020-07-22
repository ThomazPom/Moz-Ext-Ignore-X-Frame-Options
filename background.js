var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')
var theRegex = null;
var allowedFrames={};
var headersdo = {
	"content-security-policy":(x=>{return false}),
	"x-frame-options":(x=>{return false})
}

function updateRegexpes()
{
	chrome.storage.local.get(null, function(res) {
		var  regstr = (res.regstr_allowed || defaultRgx);
		chrome.webRequest.onHeadersReceived.removeListener(setHeader)
		chrome.webRequest.onBeforeRequest.removeListener(registerFrame)
		if(!res.is_disabled)
		{
			theRegex = new RegExp(
				regstr.split("\n").map(
					x=>x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')	// Sanitize regex
						.replace(/(^<all_urls>|\\\*)/g,"(.*?)")	// Allow wildcards
						.replace(/^(.*)$/g,"^$1$")).join("|")	// User multi match
				)
			chrome.webRequest.onHeadersReceived.addListener(
				setHeader,
				{urls :["<all_urls>"], types:["sub_frame","object"]},
				["blocking", "responseHeaders"]
				);
			chrome.webRequest.onBeforeRequest.addListener(
				registerFrame,
				{urls :["<all_urls>"], types:["sub_frame","object"]}
				,[]
			);
		}
	});
} 
function registerFrame(e){
	chrome.webNavigation.getFrame({
				tabId: e.tabId,
				frameId: e.parentFrameId
		},frameInfo=>{
			allowedFrames[e.requestId]=frameInfo;
		})
}
function setHeader(e) {
	e.parentFrame = allowedFrames[e.requestId];
	delete allowedFrames[e.requestId];
	return {
				responseHeaders:e.parentFrame.url.match(theRegex)
				?e.responseHeaders.filter(x=>(headersdo[x.name.toLowerCase()]||Array)())
				:e.responseHeaders
			}
	
}
updateRegexpes();
var portFromCS;
function connected(p) {
	portFromCS = p;
	portFromCS.onMessage.addListener(function(m) {
		chrome.storage.local.set(m,updateRegexpes);
	});
}
chrome.runtime.onConnect.addListener(connected);
console.log("LOADED");