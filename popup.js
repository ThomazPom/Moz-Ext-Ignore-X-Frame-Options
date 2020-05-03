var defaultRgx =  ["<all_urls>","*://*/*","https://*.w3schools.com/*"].join('\n')


var myPort = browser.runtime.connect({name:"port-from-cs"});


browser.storage.local.get("regstr_allowed", function(res) {
  var regstr = (res.regstr_allowed || defaultRgx);
  document.querySelector(".listextarea").value=regstr;
});
window.onload= function()
{
  txarea = document.querySelector(".listextarea");
  
txarea.onkeyup = txarea.onchange
  = function(){
  	regstr = txarea.value.trim()
    myPort.postMessage({
    	updateRegexpes: regstr
    }); 

  }
}
