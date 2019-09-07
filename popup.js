var defaultRgx =  ["http://*/*", "https://*/*"].join('\n')
var defaultRgx_fancestor =  ["http://*", "https://*", "file://*"].join('\n')

var myPort = browser.runtime.connect({name:"port-from-cs"});


browser.storage.local.get("regstr_fancestor", function(res) {
  var regstr_fancestor = (res.regstr_fancestor || defaultRgx_fancestor);
  document.querySelector(".listextarea_fancestor").value=regstr_fancestor;
});
browser.storage.local.get("regstr", function(res) {
  var regstr = (res.regstr || defaultRgx);
  document.querySelector(".listextarea").value=regstr;
});
window.onload= function()
{
  txarea = document.querySelector(".listextarea");
  txarea_fancestor = document.querySelector(".listextarea_fancestor");
  txarea.onkeyup = txarea.onchange = txarea_fancestor.onkeyup = txarea_fancestor.onchange
  = function(){
    regstr = txarea.value.trim()
    regstr_fancestor = txarea_fancestor.value.trim()
    myPort.postMessage({
    	updateRegexpes: regstr,
    	updateRegexpes_fancestor:regstr_fancestor
    }); 
  }
}
