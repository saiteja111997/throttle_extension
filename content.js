// content.js
// Listen for a message from the background script

// let id = "";
session_id = ""
userId = ""

console.log("Content script injection started!!");

 // Function to check and update authentication state
 function updateAuthState() {
  if (window.chrome && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
      if (data.isAuthenticated) {
        console.log("User ID:", data.throttle_user_id); // For debugging

        userId = data.throttle_user_id
      } 
    });
  } else {
    console.error("chrome.storage.local is not available.");
  }
}

// Helper function to get XPath for an element
function getXPath(element) {
  if (element.id !== '') return 'id("' + element.id + '")';

  if (element === document.body) return element.tagName.toLowerCase();

  var siblings = Array.from(element.parentNode.children);
  var index = siblings.indexOf(element) + 1;

  return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + index + ']';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "showSearchBar") {
    console.log("Calling the search bar function !!");
    // userId = message.userId

    if (message.status === "old") {
      
    } else {
      showSearchBar(message.type, message.status, message.id);
    }
  }

  //  if (message.action === "updateUserId") {
  //   console.log("Updating user id with value : ", message.userId)
  //   userId = message.userId
  //  }

  //  if (message.action === "updateUserIdFromBackgroundReply" && userId !== "") {
  //   console.log("Updating user id for the new tab")
  //   userId = message.userId
  //  }

});

async function getText() {
  var selection = window.getSelection();
  let selectedText = selection.toString().trim();
  console.log(selectedText);

  if (selectedText.length === 0) {
    // Do nothing
  } else {
    var currentURL = window.location.href;
    console.log("Current url : ", currentURL);
    const formData = new FormData();

    formData.append("text", selectedText);
    formData.append("error_id", session_id);
    formData.append("user_id", userId);

    console.log("Printing error id : ", session_id)

    try {
      const response = await fetch("http://127.0.0.1:8080/file_upload/user_action", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Response from server:", responseData);
      } else {
        console.error("Request failed with status:", response.status);
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  }
}

function showSearchBar(type, status, id) {

  updateAuthState();
  // Create a background overlay
  const overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Semi-transparent black background
  overlay.style.zIndex = "9999"; // Place it above the page content

  // Create the search bar element
  const searchBar = document.createElement("div");
  searchBar.style.position = "fixed";
  searchBar.style.top = "50%";
  searchBar.style.left = "50%";
  searchBar.style.transform = "translate(-50%, -50%)";
  searchBar.style.width = "90%"; // 3/4th width of the viewport
  searchBar.style.zIndex = "10000"; // Place it above the overlay

  // Create a container for the input field and button
  const inputContainer = document.createElement("div");
  inputContainer.style.display = "flex"; // Display children side by side
  inputContainer.style.alignItems = "center"; // Center vertically
  inputContainer.style.justifyContent = "center"; // Center horizontally
  inputContainer.style.gap = "20px"; // Space between input and button

  // Create the search input field
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "searchInput";

  // if (type == "error") { 
  //   searchInput.placeholder = "eg; -bash: aws: command not found !!";
  // } else if (type == "document") {
  //   searchInput.placeholder = "eg; How we solved connection timeouts in postgres !!";
  // }

  
  searchInput.style.width = "70%"; // Adjust the width as needed
  searchInput.style.border = "none"; // Remove the input border
  searchInput.style.borderRadius = "50px"; // Rounded corners
  searchInput.style.background = "linear-gradient(to right, #000000, #333333)"; // Shiny black linear gradient
  searchInput.style.backgroundColor = "#333333"; // Set a base color
  searchInput.style.border = "1px solid #000000"; // Black border
  searchInput.style.color = "#FFFFFF"; // White text color
  searchInput.style.padding = "20px";
  searchInput.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)"; // Box shadow

  // Create the camera button (input type file)
  const cameraButton = document.createElement("label");
  cameraButton.htmlFor = "screenshotInput";
  cameraButton.style.cursor = "pointer"; // Change cursor to pointer

  iconUrl = chrome.runtime.getURL("images/camera.png");
  cameraButton.innerHTML = `<img src="${iconUrl}" alt="Camera">`;
  const screenshotInput = document.createElement("input");
  screenshotInput.type = "file";
  screenshotInput.id = "screenshotInput";
  screenshotInput.accept = "image/*"; // Accept image files
  screenshotInput.style.display = "none"; // Hide the file input
  screenshotInput.multiple = true; // Allow multiple file selection
  screenshotInput.addEventListener("change", (event) => {
    const selectedFiles = event.target.files;
    if (selectedFiles.length > 0) {
      const filesToProcess = selectedFiles.length <= 4 ? selectedFiles : Array.from(selectedFiles).slice(0, 4);
      filesToProcess.forEach((file, index) => {
        console.log(`Selected file ${index + 1}:`, file);
      });
    }
  });

  // Create the search button
  const searchButton = document.createElement("button");
  searchButton.id = "searchButton";
  searchButton.textContent = "Go!!";
  searchButton.style.borderRadius = "50px"; // Rounded button
  searchButton.style.backgroundColor = "#333333"; // Shiny black button background color
  searchButton.style.color = "#FFFFFF"; // White button text color
  searchButton.style.padding = "20px"; // Adjust the padding as needed
  searchButton.style.border = "1px solid #000000"; // Black border
  searchButton.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)"; // Box shadow

  // Create the spinner element
  const spinner = document.createElement("div");
  spinner.id = "spinner";
  spinner.style.display = "none"; // Hide the spinner initially
  spinner.style.border = "8px solid #f3f3f3"; // Light grey
  spinner.style.borderTop = "8px solid #333333"; // Black
  spinner.style.borderRadius = "50%";
  spinner.style.width = "40px";
  spinner.style.height = "40px";
  spinner.style.animation = "spin 1s linear infinite";

  // Add the spinner CSS
  const style = document.createElement("style");
  style.innerHTML = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  // Append the elements to the input container
  inputContainer.appendChild(searchInput);
  inputContainer.appendChild(cameraButton);
  inputContainer.appendChild(screenshotInput);
  inputContainer.appendChild(searchButton);
  inputContainer.appendChild(spinner);

  // Append the container to the search bar
  searchBar.appendChild(inputContainer);

  // Add an event listener to the overlay to remove the overlay and search bar when clicked
  overlay.addEventListener("click", () => {
    overlay.remove();
    searchBar.remove();
  });

  document.body.appendChild(overlay);
  document.body.appendChild(searchBar);

  // Focus the search bar
  searchBar.focus();

  // Add an event listener for the search button to prevent the overlay removal when the button is clicked
  searchButton.addEventListener("click", async (event) => {

    const searchText = searchInput.value;
    title = searchText
    const formData = new FormData();
    formData.append("text", searchText);
    formData.append("userId", userId);
    // formData.append("type", type)

    const screenshotInput = document.getElementById("screenshotInput");
    if (screenshotInput.files.length > 0) {
      for (let i = 0; i < screenshotInput.files.length; i++) {
        const file = screenshotInput.files[i];
        formData.append("images", file);
      }
    }

    // Show spinner and disable the search button
    spinner.style.display = "block";
    searchButton.disabled = true; 
    searchButton.style.backgroundColor = "#555555"; // Change color to indicate disabled state


    try {
      const response = await fetch("http://127.0.0.1:8080/file_upload/upload_error", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Response from server:", responseData);
        id = responseData["session_id"];
        console.log("Error id : ", id);

        // Notify the popup script 
        chrome.runtime.sendMessage({
          action: "sessionStarted",
          title: searchText,
          id: id
        });

        // Remove the overlay and search bar after successful response
        overlay.remove();
        searchBar.remove();
      } else {
        console.error("Request failed with status:", response.status);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      // Hide spinner and re-enable the search button
      spinner.style.display = "none";
      searchButton.disabled = false;
      searchButton.style.backgroundColor = "#333333"; // Restore original color
    }

    event.stopPropagation(); // Prevent the click event from propagating to the overlay
  });
}

// Dynamically load FontAwesome CSS
const link = document.createElement('link');
link.rel = 'stylesheet';
link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
document.head.appendChild(link);

function makeTimerDraggable(timerContainer) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  timerContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    offsetX = e.clientX - timerContainer.getBoundingClientRect().left;
    offsetY = e.clientY - timerContainer.getBoundingClientRect().top;
    timerContainer.style.cursor = 'grabbing'; // Change cursor to grabbing

    // Remove bottom property and set top property to prevent expansion issue
    timerContainer.style.bottom = 'unset';
    timerContainer.style.right = 'unset';
    timerContainer.style.top = `${e.clientY - offsetY}px`;
    timerContainer.style.left = `${e.clientX - offsetX}px`;
  });

  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      timerContainer.style.left = `${e.clientX - offsetX}px`;
      timerContainer.style.top = `${e.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
    timerContainer.style.cursor = 'grab'; // Change cursor back to grab
  });
}

let timerDisplay, timerContainer, startStopButton, isTimerRunning, seconds;

// Listen for a message from the background script for timer updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateState") {
    if (document.getElementById("timer-container")) {
      document.getElementById("timer-container").remove();
    }

    updateAuthState()

    session_id = message.id

    console.log("Update state called!!");
    const timerContainer = document.createElement('div');
    timerContainer.id = 'timer-container';
    timerContainer.style.position = 'fixed';
    timerContainer.style.bottom = '20px'; // Adjusted position to the bottom
    timerContainer.style.right = '20px'; // Adjusted position to the right
    timerContainer.style.width = '250px'; // Adjusted width
    timerContainer.style.height = 'auto'; // Auto height

    // Gradient background
    timerContainer.style.background = 'linear-gradient(45deg, #333333, #000000)';
    timerContainer.style.borderRadius = '10px';
    timerContainer.style.padding = '15px';
    timerContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
    timerContainer.style.cursor = 'grab'; // Set cursor to grab for draggable

    document.body.appendChild(timerContainer);

    // Make the timer draggable
    makeTimerDraggable(timerContainer);

    // HTML template
    timerContainer.innerHTML = `
      <div style="padding: 10px; background: linear-gradient(45deg, #333333, #000000); border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);">
        <div style="display: flex; align-items: center; overflow: hidden; white-space: nowrap;">
          <div style="flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 10px;">
            <marquee behavior="scroll" direction="left" scrollamount="3" style="color: #FFFFFF;">
              ${message.title}
            </marquee>
          </div>
          <div style="display: flex; gap: 10px;">
            <i id="cancel-icon" class="fas fa-times" style="cursor: pointer; color: red;" title="Cancel journey"></i>
            <i id="tick-icon" class="fas fa-check" style="cursor: pointer; color: green;" title="End journey"></i>
            <i id="pause-icon" class="fas fa-pause" style="cursor: pointer; color: yellow;" title="Pause journey"></i>
          </div>
        </div>
      </div>
    `;

    document.getElementById("cancel-icon").addEventListener("click", () => {
      // Handle cancel action
      timerContainer.remove();
      chrome.runtime.sendMessage({
        action: "removeTimer",
      });
    });

    document.getElementById("tick-icon").addEventListener("click", () => {
      // Handle tick action (e.g., mark as done and open new page)
      console.log("Printing the error id before opening the browser tab, errorID : ", message.id);
      const url = `http://localhost:3000/preDocEdit/?error_id=${message.id}`;
      window.open(url, '_blank');
      timerContainer.remove();
      chrome.runtime.sendMessage({
        action: "removeTimer",
      });
    });

    document.getElementById("pause-icon").addEventListener("click", () => {
      // Handle pause action (e.g., toggle pause/resume)
      console.log("Pause action clicked");
      // Implement pause/resume functionality as needed
      chrome.runtime.sendMessage({
        action: "pauseTimer",
      });
    });

    window.addEventListener("mouseup", getText);
  } else if (message.action === "removeTimer") {
    const timerContainer = document.getElementById("timer-container");
    if (timerContainer) {
      timerContainer.remove();
    }

    window.removeEventListener("mouseup", getText);

    chrome.runtime.sendMessage({
      action: "done",
    });
  } else if (message.action === "pauseTimer") {
    // Handle pause action
    console.log("Timer paused");
    // Pause logic here, for example:
    // clearInterval(timerInterval);
  }
});

console.log("Content script injection ended!!");
