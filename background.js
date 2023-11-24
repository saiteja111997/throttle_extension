// background.js

// Function to send a message to all tabs
function sendMessageToAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
}

// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Injecting content scripts into all tabs");

  // Get the manifest content scripts
  const contentScripts = chrome.runtime.getManifest().content_scripts;

  // Function to inject content scripts into a tab
  const injectContentScripts = (tabId) => {
    for (const contentScript of contentScripts) {
      chrome.scripting.executeScript({
        target: { tabId },
        files: contentScript.js,
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error injecting script: ${chrome.runtime.lastError.message}`);
        } else {
          console.log(`Script ${contentScript.js[0]} injected into tab ${tabId}`);
        }
      });
    }
  };

  // Iterate through all open tabs and inject content scripts
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      injectContentScripts(tab.id);
    }
  });
});

var initialTabID, startClickID, stopClickID;

// Listen for timer state updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateTimerState") {
    console.log("Received a updateTimerState message from content script!!");
    
    // Send the message to all tabs
    sendMessageToAllTabs(message);

    // if (message.initialState === true) {
    //  initialTabID = message.initialTabID
    // }

    // startClickID = setInterval(() => {
    //   chrome.tabs.sendMessage(initialTabID, {
    //     action: "startClick",
    //   })
    // }, 15000);

    // stopClickID = setInterval(() => {
    //   chrome.tabs.sendMessage(initialTabID, {
    //     action: "stopClick",
    //   })
    // }, 17000);    

  } else if (message.action === "timerRemoved") {
    console.log("Timer Removed, so scraping all the content scripts")
    // Remove content scripts from all tabs
    const contentScripts = chrome.runtime.getManifest().content_scripts;

    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        const matchesContentScript = contentScripts.some((contentScript) =>
          tab.url.match(contentScript.matches)
        );
  
        if (matchesContentScript) {
          contentScripts.forEach((contentScript) => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: removeContentScript,
            });
          });
        }
      });
    });

    function removeContentScript() {
      // Function to remove content scripts in the tab
      const scriptElements = document.querySelectorAll('script[src^="chrome-extension://"]');
      scriptElements.forEach((scriptElement) => {
        scriptElement.remove();
      });
    }

  } else if (message.action === "removeTimer") {
    console.log("Received a removeTimer message from content script!!");
    
    // Send the message to all tabs
    sendMessageToAllTabs(message);
  } 
  // else if (message.action === "startClickExcecuted") {
  //   console.log("Stoping the Start click interval")
  //    clearInterval(startClickID)
  // } else if (message.action === "stopClickExcecuted") {
  //   console.log("Stoping the Stop click interval")
  //   clearInterval(stopClickID)
  // }
});
