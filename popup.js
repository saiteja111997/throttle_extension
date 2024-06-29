document.addEventListener("DOMContentLoaded", function() {
  const authButtons = document.getElementById("auth-buttons");
  const mainButtons = document.getElementById("main-buttons");

  let userId = ""

  // Function to check and update authentication state
  function updateAuthState() {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
        if (data.isAuthenticated) {
          authButtons.style.display = "none";
          mainButtons.style.display = "block";
          console.log("User ID:", data.throttle_user_id); // For debugging

          userId = data.throttle_user_id

          fetchErrorTitles(); // Fetch error titles when authenticated
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

  // Function to fetch error titles from backend API
  function fetchErrorTitles() {
    // For now, using dummy titles
    const dummyTitles = [
      { title: "Error 1", status: "incomplete" },
      { title: "Error 2", status: "incomplete" },
      { title: "Error 3", status: "incomplete" }
    ];
    const errorList = document.getElementById("errorList");
    errorList.innerHTML = "";
    dummyTitles.forEach(error => {
      const li = document.createElement("li");
      li.textContent = `${error.title} - ${error.status}`;
      errorList.appendChild(li);
    });

    // Uncomment the following lines to make a real API call
    /*
    fetch('YOUR_BACKEND_API_ENDPOINT')
      .then(response => response.json())
      .then(data => {
        const errorList = document.getElementById("errorList");
        errorList.innerHTML = "";
        data.forEach(error => {
          const li = document.createElement("li");
          li.textContent = `${error.title} - ${error.status}`;
          errorList.appendChild(li);
        });
      })
      .catch(error => console.error('Error fetching error titles:', error));
    */
  }

  // Function to append current error title block
  // function appendCurrentErrorTitle(title) {
  //   console.log(title)
  //   const header = document.querySelector('.header');
  //   const errorTitleBlock = document.createElement('div');
  //   errorTitleBlock.classList.add('current-error-title-block');
  //   errorTitleBlock.innerHTML = `
  //     <div class="error-title">${title}</div>
  //     <button class="done-button">Done</button>
  //   `;
  //   header.insertAdjacentElement('afterend', errorTitleBlock);

  //   // Add event listener to the Done button
  //   errorTitleBlock.querySelector('.done-button').addEventListener('click', () => {
  //     errorTitleBlock.remove();
  //   });
  // }

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
    
    // chrome.runtime.sendMessage({ 
    //   "action": "updateUserId",
    //   "userId": userId,
    // }, () => {
    //   if (chrome.runtime.lastError) {
    //     console.error(chrome.runtime.lastError);
    //   } else {
    //     console.log("Message sent successfully");
    //   }
    // });

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

  // Event listener for create document button
  document.getElementById("createDocumentButton").addEventListener("click", function() {

    updateAuthState();
    console.log("Printing the user id after the click : ", userId)

    // chrome.runtime.sendMessage({ 
    //   "action": "updateUserId",
    //   "userId": userId,
    // }, () => {
    //   if (chrome.runtime.lastError) {
    //     console.error(chrome.runtime.lastError);
    //   } else {
    //     console.log("Message sent successfully");
    //   }
    // });

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
      }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
        } else {
          console.log("Message sent successfully");
        }
      });
    });
  });

  // Listen for messages from the content script
  // chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //   if (request.action === "sessionStarted" && request.title) {
  //     console.log("Message received by popup.js")
  //     appendCurrentErrorTitle(request.title);
  //   }
  // });
});
