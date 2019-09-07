var defaultRgx =  ["http://*/*", "https://*/*"].join('\n')
var defaultRgx_monitorrgx =  ["someregexp/#/somemodifier","MatchCaseString/#/gi"].join('\n')
var pending_requests = {};
var registered_tabs = []
var all_requests = []
browser.storage.local.get("all_requests", function(res) {
		all_requests = (res.all_requests || []);

			all_requests_prev_len = all_requests.length;
		console.log("Loaded",all_requests.length,"previously saved requests")
});
all_requests_prev_len = 0;
setInterval(()=>{
	if(all_requests.length == all_requests_prev_len)
	{
		return;
	}
	browser.storage.local.set(
	{
		"all_requests":all_requests
	});	

	console.log("Saved",all_requests.length-all_requests_prev_len ,"requests, total of",all_requests.length)
	all_requests_prev_len = all_requests.length;
},5000);

function updateRegexpes()
{
	browser.storage.local.get("regstr_monitorrgx", function(res) {
		regstr_monitorrgx = (res.regstr_monitorrgx || defaultRgx_monitorrgx).split("\n").join(" ");
		regstr_monitorrgx = regstr_monitorrgx.split(" ").map(x => new RegExp(...x.split('/#/')));

	});
	browser.storage.local.get("regstr", function(res) {
		var  regstr = (res.regstr || defaultRgx);
		var regexpesarray = regstr.split("\n");
		browser.webRequest.onBeforeRequest.removeListener(monitorBeforeRequest)
		browser.webRequest.onBeforeRequest.addListener(
			monitorBeforeRequest,
			{urls : regexpesarray},
			["requestBody","blocking"]
		);

		browser.webRequest.onBeforeSendHeaders.removeListener(monitorBeforeHeaders)
		browser.webRequest.onBeforeSendHeaders.addListener(
			monitorBeforeHeaders,
			{urls : regexpesarray},
			["requestHeaders"]
		);
		browser.webRequest.onHeadersReceived.removeListener(monitorBeforeHeaders)
		browser.webRequest.onHeadersReceived.addListener(
			monitorHeadersReceived,
			{urls : regexpesarray},
			["responseHeaders"]
		);

	});
}
function ab2str(buf) {
  	var enc = new TextDecoder("utf-8");
	var arr = new Uint8Array(buf);
	return (enc.decode(arr));
}

function monitorHeadersReceived(e) {

	var pending_req = pending_requests[e.requestId];
	if(pending_req)
	{
		pending_req.responseHeaders=e.responseHeaders;
	}
}

function monitorBeforeHeaders(e) {
	var pending_req = pending_requests[e.requestId];
	if(pending_req)
	{
		pending_req.requestHeaders = e.requestHeaders;
		//all_requests.push(pending_req);
		//delete pending_requests[e.requestId];

	}
}

function monitorBeforeRequest(e) {
	if(registered_tabs.includes(e.tabId))
	{
		return e;
	}
	var log = false;
	var logarray = [];
	regstr_monitorrgx.forEach(function(rgx) {
  		if( e.url.match(rgx) )
  		{
			logarray.push({
				expression:rgx,
				value:e.url,
				valuefrom:"Url",
				valuekey:"url"
			})
  		}
  		if(e.method == 'POST' && e.requestBody)
  		{
  			Object.keys(e.requestBody).forEach(function(key) {
  				var postvalues=e.requestBody[key]
				if(!postvalues)
				{
					return;
				}
				console.log("key",key)
  				if(key=="raw")
  				{

  					postvalues.forEach(function(value) {
	  					var valstr =ab2str( value.bytes)
						if( valstr.match(rgx) )
						{
							logarray.push({
								expression:rgx,
								value:valstr,
								valuefrom:"requestBody",
								valuekey:key
								})
							e.bodyDecoded = valstr
						}
	  				});	

  				}

  				if(key=="formData")
  				{

  					Object.keys(e.requestBody.formData).forEach(function(key) {
  						var subvals = postvalues[key];
	  					subvals.forEach(function(valstr) {
							if((typeof valstr == "string") && valstr.match(rgx) )
							{
								logarray.push({
									expression:rgx,
									value:valstr,
									valuefrom:"formData",
									valuekey:key
									})

								e.bodyformData = e.requestBody.formData
							}
		  				});	

  					});
  				}
  			});
  		}
	});
	if( logarray.length)
	{
		var pending_req = {
			matchdetail:logarray,
			webRequest:e
		}
		pending_requests[e.requestId] = pending_req;
		let filter = browser.webRequest.filterResponseData(e.requestId);
		let decoder = new TextDecoder("utf-8");
		filter.ondata = event => {
			let str = decoder.decode(event.data, {stream: false});
			pending_req.strResponse = str;
			pending_req.bufferResponse = event.data;
			all_requests.push(pending_req);
			delete pending_requests[e.requestId];
			filter.write(event.data)
		}
	}
  	//return {requestBody: e.responseHeaders};
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
						"regstr_monitorrgx":m.updateRegexpes_monitorrgx
					},updateRegexpes);		
				}
			);
		}
		if(m.registertab)
		{
			registered_tabs.push(m.registertab)
		}
		if(m.clearcatched)
		{
				browser.storage.local.set(
				{	
					"all_requests":[]
				}
				,()=>{
					console.log("Cleared",all_requests.length,"previously saved requests")
					all_requests = [];
					all_requests_prev_len=0;
				});	
		}



	});
}
browser.runtime.onConnect.addListener(connected);