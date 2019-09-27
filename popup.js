var defaultRgx =  ["http://*/*", "https://*/*"].join('\n')
var defaultRgx_fancestor =  ["http://*","http://*:*", "https://*","https://*:*", "file://*"].join('\n')

var myPort = browser.runtime.connect({name:"port-from-cs"});


browser.storage.local.get("regstr_fancestor", function(res) {
  var regstr_fancestor = (res.regstr_fancestor || defaultRgx_fancestor);
  document.querySelector(".listextarea_fancestor").value=regstr_fancestor;
});
browser.storage.local.get("regstr", function(res) {
  var regstr = (res.regstr || defaultRgx);
  document.querySelector(".listextarea").value=regstr;
});
browser.storage.local.get("appendrather", function(res) {

  if(res.appendrather)
  {
    document.querySelector("#appendrather").setAttribute("checked","checked");
  }
});
window.onload= function()
{
  txarea = document.querySelector(".listextarea");
  txarea_fancestor = document.querySelector(".listextarea_fancestor");
  appendrather = document.querySelector("#appendrather");
  
  
  appendrather.onclick = txarea.onkeyup = txarea.onchange = txarea_fancestor.onkeyup = txarea_fancestor.onchange
  = function(){
    console.log(appendrather.checked );
    regstr = txarea.value.trim()
    regstr_fancestor = txarea_fancestor.value.trim()
    myPort.postMessage({
    	updateRegexpes: regstr,
      updateRegexpes_fancestor:regstr_fancestor,
      appendrather:appendrather.checked 
    }); 

  }
}
