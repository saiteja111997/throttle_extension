// background.js
var sessionActive;

let title = "";
let id = "";
let userId = "";
let updateIntervalId;



// Function to send a message to all tabs
function sendMessageToAllTabs(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, message);
    });
  });
}

// Add a listener in the background script to handle messages from the React app.
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === "setThrottleAuthState") {
    console.log("Printing user id : ",message.userId);
    chrome.storage.local.set(
      { 
        isAuthenticated: message.isAuthenticated,
        throttle_user_id: message.userId
      }, 
      function() {
        sendResponse({ success: true });
      }
    );

    return true; // Will respond asynchronously
  }
});

chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (message.action === "deleteThrottleAuthState") {
    console.log("Deleting user id");

    // Remove user authentication state and user ID from local storage
    chrome.storage.local.remove(["isAuthenticated", "throttle_user_id"], function() {
      if (chrome.runtime.lastError) {
        console.error("Error removing user ID:", chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError });
      } else {
        console.log("User ID and authentication state removed successfully.");
        sendResponse({ success: true });
      }
    });

    return true; // Will respond asynchronously
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openNewTab") {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(message.searchQuery)}`;
      chrome.tabs.create({ url: searchUrl }, (tab) => {
          console.log("New tab opened with search URL:", searchUrl);
      });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "reloadTab") {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(message.searchQuery)}`;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const currentTab = tabs[0];

          if (currentTab) {
              // Update the current tab with the new search URL
              chrome.tabs.update(currentTab.id, { url: searchUrl }, () => {
                  console.log("Current tab reloaded with search URL:", searchUrl);

                  // After reloading, send the search text and data to the content script in the current tab
                  chrome.tabs.onUpdated.addListener(function onTabUpdate(tabId, changeInfo, tab) {
                      // Ensure the tab has fully loaded
                      if (tabId === currentTab.id && changeInfo.status === 'complete') {
                          // Send a message to the content script to start the session with the search text and files
                          chrome.tabs.sendMessage(tabId, {
                              action: "startSession",
                              title: message.searchQuery,
                              sessionId: message.sessionId
                          });
                          
                          // Remove the listener to prevent multiple sends
                          chrome.tabs.onUpdated.removeListener(onTabUpdate);
                      }
                  });
              });
          }
      });
  }
});


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
        action: "updateState",
        title: title,
        id: id,
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Message sent successfully");
      }
    })

  //   chrome.tabs.sendMessage(tabId, {
  //     action: "updateUserId",
  //     userId: message.userId,
  // }, () => {
  //   if (chrome.runtime.lastError) {
  //     console.error(chrome.runtime.lastError);
  //   } else {
  //     console.log("Message sent successfully");
  //   }
  // })
} 
  // else if (changeInfo.status === 'complete' && !sessionActive) {
  //   if (tab.url.startsWith('https://google.com')) {
  //     chrome.tabs.sendMessage(tabId, {
  //       action: "activatePopUp"
  //     }, () => {
  //       if (chrome.runtime.lastError) {
  //         console.error(chrome.runtime.lastError);
  //       } else {
  //         console.log("Message sent successfully");
  //       }
  //     })
  //   }
  // }
});

function sendUpdateStateInIntervals() {
  updateIntervalId = setInterval(() => {
    sendMessageToAllTabs({
      action: "updateState",
      title: title,
      id: id,
    });
  }, 30000);
}

function stopUpdateStateIntervals() {
  if (updateIntervalId) {
    console.log("Stopping the interval!!")
    clearInterval(updateIntervalId);
    updateIntervalId = null; // Clear the interval ID
  }
}

// Listen for timer state updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
 
    // if (message.action === "updateUserId") {
    //   sendMessageToAllTabs({
    //     action: "updateUserId",
    //     userId: message.userId,
    //   })

    //   userId = message.userId

    // }

    // if (message.action === "updateUserIdFromBackground") {
    //   sendMessageToAllTabs({
    //     action: "updateUserIdFromBackgroundReply",
    //     userId: userId,
    //   })
    // }

    if (message.action === "sessionStarted") {
      sessionActive = true

      // let startTime = Date.now();
      console.log("Entered background script")
      // timeIntervalId = setInterval(() => {
      //   // if (startTime) {
      //     console.log("Sending message to all tabs!!")
      //     elapsedMillis = Date.now() - startTime;
      //     elapsedMinutes = Math.floor(elapsedMillis / (60 * 1000));
      //     sendMessageToAllTabs({
      //       action: "updateTimerState",
      //       initialState: false,
      //       time: elapsedMinutes
      //     })
      //   // }
      // }, 30000)
      sendMessageToAllTabs({
        action: "updateState",
        title: message.title,
        id: message.id,
      })

      title = message.title
      id = message.id

      sendUpdateStateInIntervals()

    } 
    
    if (message.action === "removeTimer") {
      // clearInterval(timeIntervalId)
      chrome.tabs.onUpdated.removeListener(null);
      chrome.tabs.onCreated.removeListener(null);
      // elapsedMinutes = 0
      sendMessageToAllTabs({
        action: "removeTimer"
      })
    }  

    if (message.action === "done") {
      sessionActive = false
      console.log("Timer Removed, so scraping all the content scripts")
      // Remove content scripts from all tabs
      const contentScripts = chrome.runtime.getManifest().content_scripts;

      stopUpdateStateIntervals();
  
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

// Background Script (background.js)
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   if (request.action === "sessionStarted") {
//     console.log("Message received by the background script!!")
//     chrome.runtime.sendMessage(request); // Relay the message to other parts of the extension
//   }
// });
