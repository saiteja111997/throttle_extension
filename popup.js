function popup() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      var activeTab = tabs[0];
      console.log("Sending the message!!")
      chrome.tabs.sendMessage(activeTab.id, {"action": "showSearchBar"});
  });
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("buttonToShowSearchBar").addEventListener("click", popup);
});