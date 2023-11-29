// background.js
var timeIntervalId, prevMinsElapsed, elapsedMillis, elapsedMinutes, sessionActive;

// Function to send a message to all tabs
function sendMessageToAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
}

function injectContentScripts(tabId) {

 // Get the manifest content scripts
 const contentScripts = chrome.runtime.getManifest().content_scripts;

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
}

// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Injecting content scripts into all tabs");
  // Iterate through all open tabs and inject content scripts
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      injectContentScripts(tab.id);
    }
  });
});

// Listen for tab creation events
chrome.tabs.onCreated.addListener((tab) => {
  if (sessionActive) {
      // Inject content script into the newly created tab
      injectContentScripts(tab.id);
      console.log("Listener activated!!")
  }
});

// Listen for update events
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && sessionActive) {
    // Do something when the page finishes loading
    console.log('Page loaded completely:', tab.url);

    chrome.tabs.sendMessage(tabId, {
      action: "updateTimerState",
      timerState: true,
      initialState: true,
      time: elapsedMinutes
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Message sent successfully");
      }
    })

  }
});

// Listen for timer state updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateTimerState" && message.initialState == true) {
      sessionActive = true
      let startTime = Date.now();
      console.log("Entered background script")
      timeIntervalId = setInterval(() => {
        // if (startTime) {
          console.log("Sending message to all tabs!!")
          elapsedMillis = Date.now() - startTime;
          elapsedMinutes = Math.floor(elapsedMillis / (60 * 1000));
          sendMessageToAllTabs({
            action: "updateTimerState",
            initialState: false,
            time: elapsedMinutes
          })
        // }
      }, 30000)
      sendMessageToAllTabs({
        action: "updateTimerState",
        timerState: true,
        initialState: true,
        time: 0
      })
    } else if (message.action === "removeTimer") {
      clearInterval(timeIntervalId)
      chrome.tabs.onUpdated.removeListener(null);
      chrome.tabs.onCreated.removeListener(null);
      elapsedMinutes = 0
      sendMessageToAllTabs({
        action: "removeTimer"
      })
    } else if (message.action === "timerRemoved") {
      sessionActive = false
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
    }
})