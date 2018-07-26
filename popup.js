// content-script.js
var defaultRgx =  ["http://*/*", "https://*/*"].join('\n')
var myPort = browser.runtime.connect({name:"port-from-cs"});
myPort.onMessage.addListener(function(m) {
  document.querySelector("#warning").innerText=m.message
});
browser.storage.local.get("regstr", function(res) {
  regstr = (res.regstr || defaultRgx);
  document.querySelector(".listextarea").value=regstr;
});
window.onload= function()
{
  txarea = document.querySelector(".listextarea");
  txarea.onkeyup = txarea.onchange = function(){
    regstr = txarea.value.trim()
    myPort.postMessage({updateRegexpes: regstr}); 
  }
}