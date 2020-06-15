var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')


var myPort = browser.runtime.connect({name:"port-from-cs"});


browser.storage.local.get(null, function(res) {
  var regstr = (res.regstr_allowed || defaultRgx);
  document.querySelector(".listextarea").value=regstr;
  document.querySelector("#disable_webext").checked=res.is_disabled;
});
window.onload= function()
{
  var txarea = document.querySelector(".listextarea");
  var disable_checkbox=  document.querySelector("#disable_webext");
	txarea.onkeyup = txarea.onchange = disable_checkbox.onchange
  = function(){
  	regstr = txarea.value.trim()
    myPort.postMessage({
    	regstr_allowed: regstr,
    	is_disabled: disable_checkbox.checked
    }); 

  }
  document.querySelector("#reset").onclick=x=>{
    if(confirm("Config will be reset to\n"+defaultRgx))
      {
        txarea.value=defaultRgx;
        txarea.onchange();
      }
  }
}
