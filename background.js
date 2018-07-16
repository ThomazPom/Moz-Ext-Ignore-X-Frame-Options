

// Add the new header to the original array,
// and return it.
function setHeader(e) {
for (var header of e.responseHeaders) {
        if (header.name.toLowerCase() === "x-frame-options") {
          header.value = "ALLOW";
        }
      }
  var setMyCookie = {
    name: "x-frame-options",
    value: "ALLOW"
  };
  e.responseHeaders.push(setMyCookie);
  return {responseHeaders: e.responseHeaders};
}

// Listen for onHeaderReceived for the target page.
// Set "blocking" and "responseHeaders".
browser.webRequest.onHeadersReceived.addListener(
  setHeader,
  {urls : ["http://*/*", "https://*/*"]},
  ["blocking", "responseHeaders"]
);
console.log("Loaded")
browser.browserAction.onClicked.addListener(function()
{
	alert();
})