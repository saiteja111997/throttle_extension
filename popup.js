document.addEventListener("DOMContentLoaded", function() {
  const authButtons = document.getElementById("auth-buttons");
  const mainButtons = document.getElementById("main-buttons");

  // Function to check and update authentication state
  function updateAuthState() {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
        if (data.isAuthenticated) {
          authButtons.style.display = "none";
          mainButtons.style.display = "block";
          console.log("User ID:", data.throttle_user_id); // For debugging
        } else {
          authButtons.style.display = "block";
          mainButtons.style.display = "none";
        }
      });
    } else {
      console.error("chrome.storage.local is not available.");
      authButtons.style.display = "block";
      mainButtons.style.display = "none";
    }
  }

  // Initial authentication state check
  updateAuthState();

  // Event listener for login/register button
  document.getElementById("login-button").addEventListener("click", function() {
    chrome.tabs.create({ url: "http://127.0.0.1:3000/login" });
  });

  // Event listener for logging error and showing search bar
  document.getElementById("buttonToShowSearchBar").addEventListener("click", function() {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
      var activeTab = tabs[0];

      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log("Content script loaded successfully in the active tab");
      }
      console.log("Sending the message!!");
      chrome.tabs.sendMessage(activeTab.id, { 
        "action": "showSearchBar",
        "initialTabID": activeTab.id
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");
        }
      });
    });
  });

  // Event listener for going to the dashboard
  document.getElementById("goToDashboardButton").addEventListener("click", function() {
    chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
  });

  // Event listener for logout button
  document.getElementById("logout-button").addEventListener("click", function() {
    // Clear user ID from local storage
    localStorage.removeItem('throttle_user_id');
    chrome.storage.local.remove(['isAuthenticated', 'throttle_user_id'], function() {
      console.log('User logged out and user ID removed.');
      updateAuthState();
    });
  });
});
