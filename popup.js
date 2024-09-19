document.addEventListener("DOMContentLoaded", function() {
  const authButtons = document.getElementById("auth-buttons");
  const mainButtons = document.getElementById("main-buttons");
  const fullWidthButton = document.getElementById("full-width-button");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const screenshotInput = document.getElementById("imageInput");

  let userId = "";

  // Enable Go button when the user types in the search input
  if (searchInput && searchButton) {
    searchInput.addEventListener("input", validateInput);

    searchButton.addEventListener("click", function () {
      if (!searchButton.disabled) {
        const errorTitle = searchInput.value.trim();

        console.log("screenshotInput element:", screenshotInput);
        if (!screenshotInput) {
        console.error("screenshotInput is not found. Check if the element exists in the DOM.");
        return; // Exit the function to prevent further errors
        }


        const files = screenshotInput.files;
    
        // Create an object with the error title and selected files
        const dataToSend = {
          text: errorTitle,
          files: files.length > 0 ? Array.from(files) : null
        };

        // Send a message to the background script to reload the current tab with the search query
        chrome.runtime.sendMessage({
          action: "reloadTab",
          searchQuery: errorTitle,
          data: dataToSend
        });

        // Send a message to content.js to handle the API request
        // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        //   chrome.tabs.sendMessage(tabs[0].id, {
        //     action: "startSession",
        //     data: dataToSend
        //   });
        // });
      }
    });
  }

  // Function to enable/disable the Go button based on input
  function validateInput() {
    const searchInputTrimmed = searchInput.value.trim();
    
    if (searchInputTrimmed.length > 0) {
      searchButton.disabled = false;
      searchButton.classList.add('active'); // Turn the button green
      searchButton.style.backgroundColor = '#28a745'; // Set to green
    } else {
      searchButton.disabled = true;
      searchButton.classList.remove('active'); // Reset button to default
      searchButton.style.backgroundColor = '#555555'; // Set to grey
    }
  } 

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
        action: "startSession",
        title: title,
        id: errorId,
        status: "old"
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

  // Event listener for going to the dashboard
  document.getElementById("goToDashboardButton").addEventListener("click", function() {
    chrome.tabs.create({ url: "http://localhost:3000/dashboard" });
  });

  // Event listener for logout button
  document.getElementById("logout-button").addEventListener("click", function() {
    // Clear user ID from local storage
    chrome.storage.local.remove(['isAuthenticated', 'throttle_user_id'], function() {
      console.log('User logged out and user ID removed.');
      updateAuthState();
    });
    window.close();
  });
});
