
var myPort = browser.runtime.connect({name:"port-from-cs"});

function clearCatchedRequest()
{		
	    myPort.postMessage({
    		clearcatched: true,
    	});
		$("table tbody").empty();
		console.log("Cleared",all_requests.length,"previously saved requests")
		all_requests = [];	
}
var mapDict = {

}


function toggleraw(val=-1)
{
	if(val.type)
	{
		$("#bodyinput").parent().toggleClass("hide")
		$("#formdata-select").parent().toggleClass("hide")
	}
	else if(val==0)
	{

		$("#rawbody").prop("checked",false)
			$("#bodyinput").parent().addClass("hide")
		$("#formdata-select").parent().removeClass("hide")
	}
	else if (val==1)
	{

		$("#rawbody").prop("checked",true)
			$("#bodyinput").parent().removeClass("hide")
		$("#formdata-select").parent().addClass("hide")
	}
}

function replayrequestbutton()
{
	var match = all_requests[parseInt(this.getAttribute("data-index"))];
	$("#methodselect").val(match.webRequest.method);
	$("#urlinput").val(match.webRequest.url);
	console.log(match)
	var willselect = [];	
	if(match.webRequest.bodyformData)
	{
		toggleraw(0)
		

		Object.keys(match.webRequest.bodyformData).forEach(key=>{
			data = {
			id:key+md5(match.webRequest.bodyformData[key].join(" ")),
			text:key +" - " + match.webRequest.bodyformData[key].join(" "),
			value:match.webRequest.bodyformData[key].join(" "),
			key:key,
		}

		if (!$('#formdata-key').find("option[value='" + data.key + "']").length) {
		    $('#formdata-key').append(new Option(data.key,data.key , true, true));
		}

		if (!$('#formdata-val').find("option[value='" + data.value + "']").length) {
		    $('#formdata-val').append(new Option(data.value,data.value , true, true));
		}

		if ($('#formdata-select').find("option[value='" + data.id + "']").length) {
		    willselect.push(data.id)
		} else { 
		    // Create a DOM Option and pre-select by default
		    var newOption = new Option(data.text, data.id, true, true);
		    // Append it to the select
		    mapDict[data.id]=data
		    willselect.push(data.id)
		    $('#formdata-select').append(newOption).trigger('change');
		} 

		})
		$('#formdata-select').val(willselect).trigger('change');
	}
	else if(match.webRequest.bodyDecoded){
		toggleraw(1);
		$("#bodyinput").val(match.webRequest.bodyDecoded)
	}

		willselect = [];

		match.requestHeaders.forEach(item=>{
			data = {
			id:item.name+md5(item.value),
			text:item.name +" - " + item.value,
			value:item.value,
			key:item.name,
		}

		if (!$('#header-key').find("option[value='" + data.key + "']").length) {
		    $('#header-key').append(new Option(data.key,data.key , true, true));
		}

		if (!$('#header-val').find("option[value='" + data.value + "']").length) {
		    $('#header-val').append(new Option(data.value,data.value , true, true));
		}

		if ($('#header-select').find("option[value='" + data.id + "']").length) {
		    willselect.push(data.id)
		} else { 
		    // Create a DOM Option and pre-select by default
		    var newOption = new Option(data.text, data.id, true, true);
		    // Append it to the select
		    mapDict[data.id]=data
		    willselect.push(data.id)
		    $('#header-select').append(newOption).trigger('change');
		} 

		})
		willselect = willselect.filter(x=>!["content-type"].includes(mapDict[x].key.toLowerCase()))
		$('#header-select').val(willselect).trigger('change');
}
function dorequest()
{
	var myheaders = {}
	$("#header-select").val().forEach(headerid=>
	{
		var headval = mapDict[headerid]
		myheaders[headval.key]=headval.value
	})
	var myformData = new FormData();

	$("#formdata-select").val().forEach(formDataid=>
	{
		var formDataval = mapDict[formDataid]
		myformData.append(formDataval.key,formDataval.value)
	})
	var mybody = myformData;
	if($("#rawbody").prop("checked"))
	{
		mybody = (new TextEncoder()).encode($("#bodyinput").val().trim())
		mybody = $("#bodyinput").val().trim()
	}
	
	var mymethod = $("#methodselect").val();
	var requestinfo = {
			method:mymethod,
			headers:new Headers(myheaders),
			cache:"no-store",
			body:mybody

	}
	if(["GET","HEAD"].includes(mymethod))
	{
		delete requestinfo["body"];
	}
		fetch($("#urlinput").val(),requestinfo).then((data)=>{
		
	 	data.arrayBuffer().then(buffer=>
	 	{
	 		data.url2 = $("#urlinput").val();
	 		
	 		addSetHeadersFor(data.url,data.headers);
	 		addInterceptHTMLContentFor(data.url,buffer);
	 		document.querySelector("iframe.preview1").src=data.url;
	 		setTimeout(()=>{
					browser.webRequest.onHeadersReceived.removeListener(setHeaders)
					browser.webRequest.onBeforeRequest.removeListener(interceptHTMLContent)
	 		},1000)

	 		text = (new TextDecoder()).decode(buffer)
	 		
				try {
				  var obj = JSON.parse(text)
				  var str = JSON.stringify(obj, undefined, 4);
				  $("#resultpre").html(syntaxHighlight(str))
				}
				catch(error) {
				  $("#resultpre").html(HtmlSanitizer(text))
				  w3CodeColor(document.getElementById("resultpre"));
				  // expected output: ReferenceError: nonExistentFunction is not defined
				  // Note - error messages will vary depending on browser
				}
		
	 		//window.putcontentinframe(data.url,text,document.querySelector("iframe"))
	 	})
	})
}
function createPre(Title,obj,isjsonable=true)
{
	var thepre = document.createElement("pre")
	var thediv = $("<div>",{class:"precollapse"})
	.append($("<h4>",{text:Title}))
	.append(thepre)
	if(isjsonable){
	  var str = JSON.stringify(obj, undefined, 4);
	  $(thepre).html(syntaxHighlight(str))
	}
	else {
	  $(thepre).html(HtmlSanitizer(String(obj)))
	  w3CodeColor(thepre);
	  // expected output: ReferenceError: nonExistentFunction is not defined
	  // Note - error messages will vary depending on browser
	}
	return thediv;
}
function createPreView(Title,match)
{
	var theframe = document.createElement("iframe")
	var thediv = $("<div>",{class:"precollapse"})
	.append($("<h4>",{text:Title}))
	.append(theframe)
	theframe.style.width="100%";
	theframe.style.height="50vh"; 	
	addSetHeadersFor(match.webRequest.url,match.responseHeaders.headers,setHeaders2);
	addInterceptHTMLContentFor(match.webRequest.url,match.bufferResponse);
	theframe.src=match.webRequest.url;
	setTimeout(()=>{
					browser.webRequest.onHeadersReceived.removeListener(setHeaders2)
					browser.webRequest.onBeforeRequest.removeListener(interceptHTMLContent)
	},1000)


	return thediv;
}

function detailrequestbutton()
{
	$(".bd-detail-modal-lg").modal("show");
	var mcontent =  $(".bd-detail-modal-lg .modal-body");
	mcontent.empty();
	match = all_requests[parseInt(this.getAttribute("data-index"))];
	console.log(match);
	mcontent.append(createPre("Method",match.webRequest.method	))
	mcontent.append(createPre("Url",match.webRequest.url	))
	mcontent.append(createPre("Type",match.webRequest.type	))
	mcontent.append(createPre("Date",new Date(match.webRequest.timeStamp)	))
	mcontent.append(createPre("TimeStamp",match.webRequest.timeStamp)	)
	
	mcontent.append(createPre("Matched on",match.matchdetail	))
	
	mcontent.append(createPre("Headers",match.requestHeaders	))
	mcontent.append(createPre("Body",match.webRequest.bodyformData || match.webRequest.bodyDecoded || "(No body)"	))
	mcontent.append(createPre("Response",match.strResponse,false	))
	mcontent.append(createPreView("Preview",match))

	//playaccordion();
}
var i = 0;
function playaccordion()
{
	i++;
	var mcontent =  $(".bd-detail-modal-lg .modal-body");
	accordion = $("<div>",{class:"accordion",id:'#accordionReq'})

	mcontent.find(".precollapse").each(function(){
		accordion.append(`<div class="card-header" id="headingOne">
      <h2 class="mb-0">
        <button class="btn btn-link" type="button" data-toggle="collapse" data-target="#collapseOne" aria-expanded="false" aria-controls="collapseOne">
          
        </button>
      </h2>
    </div>

    <div id="collapseOne" class="collapse" aria-labelledby="headingOne" data-parent="#accordionReq">
      <div class="card-body">
       </div>
    </div>
  </div>`)
		accordion.find("[data-target='#collapseOne']").prepend($(this).find('h4')).attr("data-target","#collapse"+i).attr("aria-controls","collapse"+i)
		accordion.find("#collapseOne").prepend($(this)).attr("id","collapse"+i)
	})
	mcontent.append(accordion);
}
function setHeaders2(e) {
	var headersdelete = ["content-security-policy","x-frame-options"]
	var cspval="";
	e.responseHeaders= setHeadersForData.filter(x=>{
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

function addwithfields()
{
		var iname = this.getAttribute("data-target");
		var ikey  = document.querySelector("[list='"+iname+"-key']")
		var ival  = document.querySelector("[list='"+iname+"-val']")
		var select = $("#"+iname+"-select");
		var willselect = select.val();
		var data = {	
			id:ikey.value+md5(ival.value),
			text:ikey.value +" - " + ival.value,
			value:ival.value,
			key:ikey.value
		}
		if (select.find("option[value='" + data.id + "']").length) {
		    willselect.push(data.id)
		} else { 
		    // Create a DOM Option and pre-select by default
		    var newOption = new Option(data.text, data.id, true, true);
		    // Append it to the select
		    mapDict[data.id]=data
		    willselect.push(data.id)
		    select.append(newOption).trigger('change');
		}
		select.val(willselect);

}

var getLocation = function(href) {
    var l = document.createElement("a");
    l.href = href;
    return l;
};
    $(document).ready(function() {
    $("body").on("click",".clearcatchedbutton",clearCatchedRequest)
   $("body").on("click",".replayrequestbutton",replayrequestbutton)
   $("body").on("click",".addbutton",addwithfields)
   $("body").on("click",".detailrequestbutton",detailrequestbutton)
   $("body").on("click","#rawbody",toggleraw)
    toggleraw(0)
   $("body").on("click",".sendbutton",dorequest)
    $('#header-select,#formdata-select').select2({"width":"80%"});
});
    browser.storage.local.get("all_requests", function(res) {
		all_requests = (res.all_requests || []);

			all_requests_prev_len = all_requests.length;
		console.log("Loaded",all_requests.length,"previously saved requests")


		 basetr = $(".base").clone();
		 table = $("table");
		//console.log(basetr);
		$(".base").remove();
		index = 0;
		all_requests.forEach(function(req){


			var ntr = basetr.clone();
			ntr.find(".num").html(index)
			
			ntr.find(".url").html($("<a>",{href:req.webRequest.url,text:getLocation(req.webRequest.url).hostname}))
			ntr.find(".method").html(req.webRequest.method)
			ntr.find(".date").html( new Date(req.webRequest.timeStamp))
			ntr.find(".match").html(  req.matchdetail.map(x=>[x.expression.source.replace(/\\/g,''),"in",x.valuefrom,'(',x.valuekey,')'].join(" ")).join(",")	 )
			ntr.find(".replay .replayrequestbutton").attr("data-index",index)
			ntr.find(".detail .detailrequestbutton").attr("data-index",index)
			
			index++;
			
			table.append(ntr);
			//ntr2 = $("<tr>",).append($("<td>",{"colspan":7}).append($("<input>",{type:"text",class:"form-control",value:req.webRequest.url})))
			//table.append(ntr2);
			
		})
});


var setHeadersForData = {};
function addSetHeadersFor(url,headers,listener=setHeaders)
{
	setHeadersForData=headers;
	browser.webRequest.onHeadersReceived.addListener(
	  listener,
	  {urls: [url]},
	  ["blocking", "responseHeaders"]
	);
}

function setHeaders(e) {
	console.log("setheaders")
	e.responseHeaders = [];
	var headersdelete = ["x-frame-options"]
	for (var pair of setHeadersForData.entries()) {
		var key = pair[0].toLowerCase();
		var value = pair[1];
		
		if(key=="content-security-policy" && value.includes("frame-ancestors"));
		{
			value =  value.replace(/frame-ancestors[^;]*;?/,"frame-ancestors moz-extension://*")
		}
		if(!headersdelete.includes(key))
		{
		   	e.responseHeaders.push({name:pair[0],value:value})
		}
	}
	e.responseHeaders.push({
		name: "x-frame-options",
		value: "ALLOW"
	});
  	return {responseHeaders: e.responseHeaders};
}

function interceptHTMLContent(requestDetails) {

let filter = browser.webRequest.filterResponseData(requestDetails.requestId);

  let decoder = new TextDecoder("utf-8");
  let encoder = new TextEncoder();
	filter.onstart = event =>{
		//Write and kill
		console.log(filter,event)
    	filter.write(interceptHTMLContentData);
		filter.close();
	}

//  filter.ondata = event => {
	//Edit and kill
	//console.log(filter,event)	
    //let str = decoder.decode(event.data, {stream: false});
    // Just change any instance of Example in the HTTP response
    // to WebExtension Example.
    //filter.write(encoder.encode("aaa"));
    //filter.close();
  //}
  //return requestDetails;

}


var interceptHTMLContentData = "";
function addInterceptHTMLContentFor(url,content)
{
	interceptHTMLContentData=content;
	browser.webRequest.onBeforeRequest.addListener(
	  interceptHTMLContent,
	  {urls: [url]},
	  ["blocking"]
	);
}
var gettingCurrent = browser.tabs.getCurrent();

gettingCurrent.then(tab=>{

	    myPort.postMessage({
    		registertab: tab.id,
    	});

 	var setReqHeader =function(e) {
		if(tab.id!=e.tabId)
 		{
 			return;
 		}
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
				cspval.replace(/frame-ancestors[^;]*;?/, "frame-ancestors "+document.location.href+";")
					:
				"frame-ancestors "+document.location.href+";"+cspval
	  	});

	  	return {responseHeaders: e.responseHeaders};
	}
	browser.webRequest.onHeadersReceived.addListener(
		setReqHeader,
		{urls : ["<all_urls>"]},
		["blocking", "responseHeaders"]
	);
});