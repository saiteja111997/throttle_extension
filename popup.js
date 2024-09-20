document.addEventListener("DOMContentLoaded", function() {
  const authButtons = document.getElementById("auth-buttons");
  const mainButtons = document.getElementById("main-buttons");
  const fullWidthButton = document.getElementById("full-width-button");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  let selectedFiles = [];
  let throttleUserId = "";

  // Function to get throttle_user_id from chrome.storage.local
  function getThrottleUserId() {
    return new Promise((resolve, reject) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
          if (data.isAuthenticated) {
            console.log("Authenticated");
            console.log("User ID:", data.throttle_user_id); // For debugging
            resolve(data.throttle_user_id);  // Resolve with the throttle_user_id
          } else {
            console.error("User is not authenticated.");
            reject("User is not authenticated");
          }
        });
      } else {
        console.error("chrome.storage.local is not available.");
        reject("chrome.storage.local is not available");
      }
    });
  }


  // Enable Go button when the user types in the search input
  if (searchInput && searchButton) {
    searchInput.addEventListener("input", validateInput);

    searchButton.addEventListener("click", async function () {
      if (!searchButton.disabled) {
        const errorTitle = searchInput.value.trim();
  
        // Ensure image input exists
        if (!imageInput) {
          console.error("imageInput is not found. Check if the element exists in the DOM.");
          return;
        }
  
        // Get selected files and form data
        const selectedFiles = imageInput.files;
        if (selectedFiles.length === 0) {
          console.error("No files selected.");
        }
  
        // Get throttle_user_id from localStorage (or using chrome.storage.local)
        const throttleUserId = await getThrottleUserId(); // Assuming this function is already defined
        if (!throttleUserId) {
          console.error("No throttle_user_id found.");
          return;
        }
  
        // Prepare the form data
        const formData = new FormData();
        formData.append("text", errorTitle); // Add the text input
        formData.append("userId", throttleUserId); // Add throttle_user_id
        for (let i = 0; i < selectedFiles.length; i++) {
          formData.append("images", selectedFiles[i]); // Add the selected images
        }
  
        // Disable the popup content to prevent interactions
        const popupContent = document.body;  // Assuming you want to disable the entire popup content
        popupContent.classList.add("popup-disabled");
  
        // Change button text to loading and show spinner
        searchButton.disabled = true;
        searchButton.textContent = "";
        const spinner = document.createElement("span");
        spinner.classList.add("button-spinner");
        searchButton.appendChild(spinner);
  
        try {
          // Make the asynchronous POST request to upload images, text, and throttle_user_id
          const response = await fetch("http://127.0.0.1:8080/file_upload/upload_error", {
            method: "POST",
            body: formData,
          });
  
          if (response.ok) {
            const responseData = await response.json();
            console.log("Response from server:", responseData);
            let sessionId = responseData["session_id"];
  
            // Send a message to the background script without including data
            chrome.runtime.sendMessage({
              action: "reloadTab",
              searchQuery: errorTitle,
              sessionId: sessionId,
            });
  
          } else {
            console.error("Server responded with an error:", response.statusText);
          }
        } catch (error) {
          console.error("Request failed:", error);
        } finally {
          // Re-enable the form elements and reset the button text after the API call completes
          popupContent.classList.remove("popup-disabled");
          searchButton.disabled = false;
          searchButton.textContent = "Go"; // Restore original button text
        }
      }
    });

    // Handle image input changes for preview
    imageInput.addEventListener("change", function () {
      if (imageInput.files.length > 0) {
        const files = Array.from(imageInput.files);
        console.log("Files found > 1")

        // Make sure the total selected files don't exceed 4
        if (selectedFiles.length + files.length > 4) {
          alert("You can only upload a maximum of 4 images.");
          return;
        }

        // Add the selected files to the `selectedFiles` array
        selectedFiles = selectedFiles.concat(files);

        // Update the image previews
        updateImagePreviews();
      }
    });
  }

  // Function to update the image previews
  function updateImagePreviews() {
    imagePreview.innerHTML = ""; // Clear previous previews

    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = function (e) {
        const imgWrapper = document.createElement("div");
        imgWrapper.classList.add("preview-wrapper");

        const imgElement = document.createElement("img");
        imgElement.src = e.target.result;
        imgElement.alt = file.name;
        imgElement.classList.add("preview-image");

        const removeBtn = document.createElement("button");
        removeBtn.classList.add("remove-image");
        removeBtn.innerHTML = "&times;";
        removeBtn.addEventListener("click", function () {
          removeImage(index); // Remove the image when the cross button is clicked
        });

        imgWrapper.appendChild(imgElement);
        imgWrapper.appendChild(removeBtn);
        imagePreview.appendChild(imgWrapper);
      };

      reader.readAsDataURL(file);
    });
  }

  // Function to remove an image from the preview and from the `selectedFiles` array
  function removeImage(index) {
    selectedFiles.splice(index, 1); // Remove the selected file
    updateImagePreviews(); // Update the previews after removal
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
