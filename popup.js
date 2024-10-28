document.addEventListener("DOMContentLoaded", function() {
  const authButtons = document.getElementById("auth-buttons");
  const mainButtons = document.getElementById("main-buttons");
  const fullWidthButton = document.getElementById("full-width-button");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");
  const imagePreview = document.getElementById("imagePreview");
  const dropArea = document.getElementById("dropArea"); // Drag-and-drop area
  let selectedFiles = [];
  let sessionId;

  // Restore state from local storage on popup load
  restoreState();

  // Function to restore state from Chrome local storage
  function restoreState() {
    chrome.storage.local.get(["errorTitle", "storedImages"], function(data) {
      if (data.errorTitle) {
        searchInput.value = data.errorTitle;
        validateInput();
      }
      if (data.storedImages) {
        selectedFiles = data.storedImages.map(file => {
          const blob = new Blob([new Uint8Array(file.buffer)], { type: file.type });
          return new File([blob], file.name, { type: file.type });
        });
        updateImagePreviews();
      }
    });
  }

  // Drag-and-drop event listeners
  dropArea.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropArea.classList.add("highlight");
  });

  dropArea.addEventListener("dragleave", () => {
    dropArea.classList.remove("highlight");
  });

  dropArea.addEventListener("drop", (event) => {
    event.preventDefault();
    dropArea.classList.remove("highlight");
    
    const files = Array.from(event.dataTransfer.files);
    
    // Limit to 4 files
    if (selectedFiles.length + files.length > 4) {
      alert("You can only upload a maximum of 4 images.");
      return;
    }
    
    selectedFiles = selectedFiles.concat(files);
    saveState();
    updateImagePreviews();
  });

  async function updateFilePaths(errorId, selectedFiles) {
    try {
      // Initialize FormData and append the errorId
      const formData = new FormData();
      formData.append("error_id", errorId);
      console.log("Updating file paths for error ID:", errorId);
  
      // Loop through selected files and add each file name as path1, path2, etc.
      selectedFiles.forEach((file, index) => {
        formData.append(`image${index + 1}`, file.name); // Append only the file name as a path
      });
  
      // Make the fetch request to the update API endpoint
      const response = await fetch("http://127.0.0.1:8080/update_file_paths", {
        method: "POST",
        body: formData, 
      });
  
      // Check if the response is successful
      if (response.ok) {
        const result = await response.json();
        console.log("File paths updated successfully:", result);
      } else {
        console.error("Failed to update file paths:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating file paths:", error);
    }
}

  // Save state to local storage
  function saveState() {
    const filesToStore = selectedFiles.map(file => file.arrayBuffer().then(buffer => ({
      name: file.name,
      type: file.type,
      buffer: Array.from(new Uint8Array(buffer))
    })));
    
    Promise.all(filesToStore).then(storedImages => {
      chrome.storage.local.set({
        errorTitle: searchInput.value.trim(),
        storedImages: storedImages
      });
    });
  }

  // Function to get throttle_user_id from chrome.storage.local
  function getThrottleUserId() {
    return new Promise((resolve, reject) => {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
          if (data.isAuthenticated) {
            resolve(data.throttle_user_id);
          } else {
            reject("User is not authenticated");
          }
        });
      } else {
        reject("chrome.storage.local is not available");
      }
    });
  }

  // Enable Go button when the user types in the search input
  if (searchInput && searchButton) {
    searchInput.addEventListener("input", () => {
      validateInput();
      saveState(); // Save the current state whenever the input changes
    });

    searchButton.addEventListener("click", async function () {
      if (!searchButton.disabled) {
        const errorTitle = searchInput.value.trim();

        // Get throttle_user_id from chrome.storage.local
        const throttleUserId = await getThrottleUserId();
        if (!throttleUserId) {
          console.error("No throttle_user_id found.");
          return;
        }

        // Disable the popup content to prevent interactions
        const popupContent = document.body;
        popupContent.classList.add("popup-disabled");

        // Change button text to loading and show spinner
        searchButton.disabled = true;
        searchButton.textContent = "";
        const spinner = document.createElement("span");
        spinner.classList.add("button-spinner");
        searchButton.appendChild(spinner);

        // Array to store uploaded image URLs
        const uploadedImageUrls = [];

        try {
          // Step 3: Prepare FormData for final submission
          const formData = new FormData();
          formData.append("text", errorTitle);
          formData.append("userId", throttleUserId);
          
          // Append uploaded image URLs to FormData
          uploadedImageUrls.forEach((url, index) => {
            formData.append(`imageUrl${index + 1}`, url);
          });

          // Step 4: Send the remaining form data to the backend
          const response = await fetch("http://127.0.0.1:8080/file_upload/upload_error", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            const responseData = await response.json();
            sessionId = responseData["session_id"];

            // Send a message to the background script
            chrome.runtime.sendMessage({
              action: "reloadTab",
              searchQuery: errorTitle,
              sessionId: sessionId,
            });

            console.log("Error uploaded successfully");

            // Clear storage after successful submission
            chrome.storage.local.remove(["errorTitle", "storedImages"]);
          } else {
            console.error("Server responded with an error:", response.statusText);
          }

          // Step 1: Get presigned URLs for each selected image
          for (let file of selectedFiles) {
            console.log(`Uploading ${file.name}...`);
            // Request a presigned URL from your backend for each file
            const presignedResponse = await fetch("http://127.0.0.1:8080/generate-presigned-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileName: file.name, errorId: sessionId}),
            });
            
            const presignedData = await presignedResponse.json();
            const presignedUrl = presignedData.url;

            if (!presignedUrl) {
              console.error("Failed to get presigned URL.");
              continue;
            }

            // Step 2: Use the presigned URL to upload the file
            await fetch(presignedUrl, {
              method: "PUT",
              headers: { "Content-Type": file.type },
              body: file,
            });
            
            // Store the S3 object URL after upload
            uploadedImageUrls.push(presignedData.fileUrl);  // Assuming presignedData.fileUrl has the S3 URL
            console.log(`Uploaded ${file.name} successfully`);
          }

          // Call the function to update the file paths in the database
          updateFilePaths(sessionId, selectedFiles); 
        } catch (error) {
          console.error("Request failed:", error);
        } finally {
          // Re-enable the form elements and reset the button text after the API call completes
          popupContent.classList.remove("popup-disabled");
          searchButton.disabled = false;
          searchButton.textContent = "Go";
        }
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
          removeImage(index);
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
    saveState(); // Save the updated state
    updateImagePreviews();
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
  async function fetchErrorTitles() {
    const throttleUserId = await getThrottleUserId(); 

    // Create form data
    const formData = new FormData();
    formData.append('user_id', throttleUserId);
    console.log("Printing user Id...", throttleUserId);

    fetch('https://lswu0lieod.execute-api.us-east-1.amazonaws.com/prod/file_upload/get_latest_unsolved', {
      method: 'POST',
      body: formData  // Send form data
    })
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
    chrome.tabs.create({ url: "http://localhost:3000/logout" });
  });
});