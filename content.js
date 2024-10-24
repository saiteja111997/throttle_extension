// content.js
// Listen for a message from the background script

// let id = "";
let session_id = ""
let userId = ""

console.log("Content script injection started!!");



// let throttle_user_id =  localStorage.getItem('throttle_user_id');
// console.log("Throttle user id: " + throttle_user_id);


 // Function to check and update authentication state
function updateAuthState() {
  return new Promise((resolve, reject) => {
    if (window.chrome && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(["isAuthenticated", "throttle_user_id"], function(data) {
        if (data.isAuthenticated) {
          console.log("Authenticated");
          console.log("User ID:", data.throttle_user_id); // For debugging
          userId = data.throttle_user_id;
          resolve(userId);  // Resolve with the userId
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

// Helper function to get XPath for an element
function getXPath(element) {
  if (element.id !== '') return 'id("' + element.id + '")';

  if (element === document.body) return element.tagName.toLowerCase();

  var siblings = Array.from(element.parentNode.children);
  var index = siblings.indexOf(element) + 1;

  return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + index + ']';
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startSession") {
    // userId = message.userId

    if (message.status === "old") {
      console.log("Received message, will do something!!")

      // Notify the popup script 
      chrome.runtime.sendMessage({
        action: "oldSessionStarted",
        title: message.title,
        id: message.id,
      });

    } else {
      console.log("Received message, will do something")
      uploadError(message);
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
  updateAuthState()
  var selection = window.getSelection();
  let selectedText = selection.toString().trim();
  console.log(selectedText);

  if (selectedText.length === 0 || selectedText.length > 5000) {
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
      const response = await fetch("https://lswu0lieod.execute-api.us-east-1.amazonaws.com/prod/file_upload/user_action", {
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

function uploadError(message) {
  session_id = message.sessionId
  const text = message.title

  console.log("Printing session id : ", session_id)
  // Notify the background script with the session details
  chrome.runtime.sendMessage({
    action: "sessionStarted",
    title: text,
    id: session_id,
  });
}

// Function to show the image upload modal
function showImageUploadModal() {
  // Create the modal background
  const modalBackground = document.createElement('div');
  modalBackground.id = 'modal-background';
  modalBackground.style.position = 'fixed';
  modalBackground.style.top = '0';
  modalBackground.style.left = '0';
  modalBackground.style.width = '100%';
  modalBackground.style.height = '100%';
  modalBackground.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  modalBackground.style.display = 'flex';
  modalBackground.style.justifyContent = 'center';
  modalBackground.style.alignItems = 'center';
  modalBackground.style.zIndex = '1000';

  // Create the modal content
  const modalContent = document.createElement('div');
  modalContent.style.background = '#fff';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '10px';
  modalContent.style.textAlign = 'center';
  modalContent.style.width = '300px';

  // Add HTML content to the modal
  modalContent.innerHTML = `
      <h3>Upload Image</h3>
      <input type="file" id="image-file-input" accept="image/*" />
      <button id="upload-button" style="margin-top: 10px; cursor: pointer; padding: 5px 10px; background-color: #28a745; color: white; border: none; border-radius: 5px;">Upload</button>
      <button id="close-modal-button" style="margin-top: 10px; cursor: pointer; padding: 5px 10px; background-color: red; color: white; border: none; border-radius: 5px;">Close</button>
  `;

  modalBackground.appendChild(modalContent);
  document.body.appendChild(modalBackground);

  // Add event listener for the upload button
  document.getElementById("upload-button").addEventListener("click", async () => {
      const fileInput = document.getElementById("image-file-input");
      if (fileInput.files.length > 0) {
          const selectedFile = fileInput.files[0];
          const formData = new FormData();
          formData.append("image", selectedFile);
          formData.append("session_id", session_id);

          try {
              const response = await fetch("https://your-backend-url.com/upload", {
                  method: "POST",
                  body: formData,
              });

              if (response.ok) {
                  console.log("Image uploaded successfully!");
              } else {
                  console.error("Error uploading image:", response.statusText);
              }
          } catch (error) {
              console.error("Request failed:", error);
          }
      } else {
          alert("Please select an image to upload.");
      }
  });

  // Add event listener for the close button
  document.getElementById("close-modal-button").addEventListener("click", () => {
      modalBackground.remove();
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

    console.log("Update state called: " + message.action);
    updateAuthState();
    session_id = message.id;

    console.log("Update state called!!");
    const timerContainer = document.createElement('div');
    timerContainer.id = 'timer-container';
    timerContainer.style.position = 'fixed';
    timerContainer.style.bottom = '20px';
    timerContainer.style.right = '20px';
    timerContainer.style.width = '250px';
    timerContainer.style.height = 'auto';
    timerContainer.style.background = 'linear-gradient(45deg, #333333, #000000)';
    timerContainer.style.borderRadius = '10px';
    timerContainer.style.padding = '15px';
    timerContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
    timerContainer.style.cursor = 'grab';

    document.body.appendChild(timerContainer);
    makeTimerDraggable(timerContainer);

    // HTML template with left and right blocks properly aligned with consistent width
timerContainer.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: linear-gradient(45deg, #3a3a3a, #1e1e1e); border-radius: 10px; box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);">
    <div style="flex: 1; display: flex; align-items: center; justify-content: center; padding-right: 10px;">
        <marquee behavior="scroll" direction="left" scrollamount="3" style="color: #FFFFFF; width: 100%;">
          ${message.title}
        </marquee>
    </div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; width: 80px;">
        <div style="display: flex; gap: 5px; justify-content: center; width: 100%;">
            <i id="cancel-icon" class="fas fa-times" style="cursor: pointer; color: red;" title="Cancel journey"></i>
            <i id="tick-icon" class="fas fa-check" style="cursor: pointer; color: green;" title="End journey"></i>
            <i id="pause-icon" class="fas fa-pause" style="cursor: pointer; color: yellow;" title="Pause journey"></i>
        </div>
        <button id="add-images-btn" style="display: flex; align-items: center; gap: 5px; justify-content: center; padding: 5px; background: #444; border: none; border-radius: 5px; cursor: pointer; color: #ffffff; width: 100%; max-width: 80px;">
            <i class="fas fa-camera"></i> Add Images
        </button>
    </div>
</div>
`;


    // Add event listeners for icons
    document.getElementById("cancel-icon").addEventListener("click", () => {
        timerContainer.remove();
        chrome.runtime.sendMessage({ action: "removeTimer" });
    });

    document.getElementById("tick-icon").addEventListener("click", () => {
        const url = `http://localhost:3000/#/preDocEdit/?error_id=${message.id}`;
        window.open(url, '_blank');
        timerContainer.remove();
        chrome.runtime.sendMessage({ action: "removeTimer" });
    });

    document.getElementById("pause-icon").addEventListener("click", () => {
        console.log("Pause action clicked");
        chrome.runtime.sendMessage({ action: "pauseTimer" });
    });

    // Add event listener for the "Add Images" button
    document.getElementById("add-image-button").addEventListener("click", () => {
        showImageUploadModal();
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
