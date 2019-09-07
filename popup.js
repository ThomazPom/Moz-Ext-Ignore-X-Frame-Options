var defaultRgx =  ["http://*/*", "https://*/*"].join('\n')
var defaultRgx_monitorrgx =  ["someregexp/#/somemodifier","MatchCaseString/#/gi"].join('\n')

var myPort = browser.runtime.connect({name:"port-from-cs"});


browser.storage.local.get("regstr_monitorrgx", function(res) {
  var regstr_monitorrgx = (res.regstr_monitorrgx || defaultRgx_monitorrgx);
  document.querySelector(".listextarea_monitorrgx").value=regstr_monitorrgx;
});
browser.storage.local.get("regstr", function(res) {
  var regstr = (res.regstr || defaultRgx);
  document.querySelector(".listextarea").value=regstr;
});
window.onload= function()
{
  txarea = document.querySelector(".listextarea");
  txarea_monitorrgx = document.querySelector(".listextarea_monitorrgx");
  txarea.onkeyup = txarea.onchange = txarea_monitorrgx.onkeyup = txarea_monitorrgx.onchange
  = function(){
    regstr = txarea.value.trim()
    regstr_monitorrgx = txarea_monitorrgx.value.trim()
    myPort.postMessage({
    	updateRegexpes: regstr,
    	updateRegexpes_monitorrgx:regstr_monitorrgx
    }); 
  }
}
