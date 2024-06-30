document.addEventListener("DOMContentLoaded", function() {
  const authButtons = document.getElementById("auth-buttons");
  const mainButtons = document.getElementById("main-buttons");
  const fullWidthButton = document.getElementById("full-width-button");

  let userId = "";

  // Function to check and update authentication state
  function updateAuthState() {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
        if (data.isAuthenticated) {
          authButtons.style.display = "none";
          mainButtons.style.display = "grid";
          fullWidthButton.style.display = "block";
          console.log("User ID:", data.throttle_user_id); // For debugging

          userId = data.throttle_user_id;

          fetchErrorTitles(); // Fetch error titles when authenticated
        } else {
          authButtons.style.display = "block";
          mainButtons.style.display = "none";
          fullWidthButton.style.display = "none";
        }
      });
    } else {
      console.error("chrome.storage.local is not available.");
      authButtons.style.display = "block";
      mainButtons.style.display = "none";
      fullWidthButton.style.display = "none";
    }
  }

  // Function to fetch error titles from backend API
  function fetchErrorTitles() {
    fetch('http://127.0.0.1:8080/file_upload/get_latest_unsolved')
      .then(response => response.json())
      .then(data => {
        const errorList = document.getElementById("errorList");
        errorList.innerHTML = "";
        data.result.forEach(error => {
          const li = document.createElement("li");
          li.classList.add("error-tile");
          li.dataset.errorId = error.id;
          li.innerHTML = `
            <div class="marquee">
              <div class="marquee-content">${error.title}</div>
            </div>
            <button class="incomplete-button"></button>`;
          li.addEventListener("click", function() {
            sendMessageToContentScript(error.id, error.title);
          });
          errorList.appendChild(li);
        });
      })
      .catch(error => console.error('Error fetching error titles:', error));
  }

  // Function to send message to content script
  function sendMessageToContentScript(errorId, title) {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
      var activeTab = tabs[0];
      chrome.tabs.sendMessage(activeTab.id, { 
        "action": "showSearchBar",
        "type": "error",
        "title": title,
        "id": errorId,
        "status": "old"
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully with ID: " + errorId);
        }
      });
      window.close();
    });
  }

  // Initial authentication state check
  updateAuthState();

  // Event listener for login/register button
  document.getElementById("login-button").addEventListener("click", function() {
    chrome.tabs.create({ url: "http://127.0.0.1:3000/login" });
  });

  // Event listener for logging error and showing search bar
  document.getElementById("logError").addEventListener("click", function() {
    updateAuthState();
    console.log("Printing the user id after the click : ", userId)

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
        "type": "error",
        "id": "",
        "status": "new"
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");
        }
      });
      window.close();
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
    window.close();
  });

  // Event listener for create document button
  document.getElementById("createDocumentButton").addEventListener("click", function() {
    updateAuthState();
    console.log("Printing the user id after the click : ", userId)

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
        "type": "document",
        "id": "",
        "status": "new"
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");
        }
      });
      window.close();
    });
  });
});
