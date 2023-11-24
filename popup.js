function popup() {
  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
      var activeTab = tabs[0];

      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Content script loaded successfully in the active tab");
      }
      console.log("Sending the message!!")
      chrome.tabs.sendMessage(activeTab.id, { 
        "action": "showSearchBar" ,
        "initialTabID": activeTab.id
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");
        }
      });
      
  });
}

document.addEventListener("DOMContentLoaded", function() {
  document.getElementById("buttonToShowSearchBar").addEventListener("click", popup);
}); 

