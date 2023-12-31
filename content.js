// content.js
// Listen for a message from the background script

console.log("Content script injection started!!")

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showSearchBar") {
      console.log("Calling the search bar function !!")
      showSearchBar();
    }
  });

  let error_id = ""

  async function getText() {
    let selectedText = window.getSelection().toString().trim();
    console.log(selectedText)

    if (selectedText.length === 0) {
      // Do nothing
    } else {
            // Create a FormData object to send the data
        const formData = new FormData();

        formData.append("text", selectedText)
        formData.append("error_id", error_id)
        formData.append("user_id", "1")

        // Send a POST request to your backend server (example.com)
        try {
          const response = await fetch("https://jm4e775kx3.execute-api.us-east-1.amazonaws.com/prod/file_upload/user_action", {
            method: "POST",
            body: formData,
          });

          if (response.ok) {
            // Request was successful
            const responseData = await response.json();
            console.log("Response from server:", responseData);
          } else {
            // Request failed
            console.error("Request failed with status:", response.status);
          }
        } catch (error) {
          // Handle any network errors
          console.error("Network error:", error);
        }
    }
  }
  
  function showSearchBar() {
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
    searchInput.placeholder = "Type your error !!";
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
    cameraButton.innerHTML = '<img src = iconUrl alt="Camera">';
    const screenshotInput = document.createElement("input");
    screenshotInput.type = "file";
    screenshotInput.id = "screenshotInput";
    screenshotInput.accept = "image/*"; // Accept image files
    screenshotInput.style.display = "none"; // Hide the file input
    screenshotInput.multiple = true; // Allow multiple file selection
    screenshotInput.addEventListener("change", (event) => {
      // Handle the selected files here (event.target.files contains the files)
      const selectedFiles = event.target.files;
      if (selectedFiles.length > 0) {
        // Ensure the number of selected files doesn't exceed 3
        const filesToProcess = selectedFiles.length <= 4 ? selectedFiles : selectedFiles.slice(0, 4);

        // Loop through the selected files and do something with each file
        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          console.log(`Selected file ${i + 1}:`, file);
        }
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


    // Append the elements to the input container
    inputContainer.appendChild(searchInput);
    inputContainer.appendChild(cameraButton);
    inputContainer.appendChild(screenshotInput);
    inputContainer.appendChild(searchButton);

    // Append the container to the search bar
  searchBar.appendChild(inputContainer);

  // Add an event listener to the overlay to remove the overlay and search bar when clicked
  overlay.addEventListener("click", () => {
    overlay.remove();
    searchBar.remove();
  });

  document.body.appendChild(overlay);
  document.body.appendChild(searchBar);

  // Add an event listener for the search button to prevent the overlay removal when the button is clicked
  searchButton.addEventListener("click", async(event) => {

    const searchText = searchInput.value;

    // Create a FormData object to send the data
    const formData = new FormData();

    // Append the text input value to the FormData
    formData.append("text", searchText);
    formData.append("userId", "1")

    // Append the selected image files to the FormData
    const screenshotInput = document.getElementById("screenshotInput");
    if (screenshotInput.files.length > 0) {
      for (let i = 0; i < screenshotInput.files.length; i++) {
        const file = screenshotInput.files[i];
        formData.append("images", file);
      }
    }

    // Send a POST request to your backend server (example.com)
    try {
      const response = await fetch("https://jm4e775kx3.execute-api.us-east-1.amazonaws.com/prod/file_upload/upload_error", {
        method: "POST",
        body: formData,
      });

      // const response = await fetch("http://127.0.0.1:3000/file_upload/upload_error", {
      //   method: "POST",
      //   body: formData,
      // });

      if (response.ok) {
        // Request was successful
        const responseData = await response.json();
        console.log("Response from server:", responseData);
        error_id = responseData["session_id"]
        console.log("Error id is : ", error_id)
      } else {
        // Request failed
        console.error("Request failed with status:", response.status);
      }
    } catch (error) {
      // Handle any network errors
      console.error("Network error:", error);
    }


    event.stopPropagation(); // Prevent the click event from propagating to the overlay
    // You can perform some action with the entered search text here
    // For example, send it to the background script to process
    // chrome.runtime.sendMessage({ action: "performSearch", searchText });
    // Notify the background script to update the timer state
    console.log("Sending message to background script!!")
    chrome.runtime.sendMessage({
      action: "updateTimerState",
      initialState: true
    });
    // Remove both the overlay and the search bar
    overlay.remove();
    searchBar.remove();
  });
}
  
let timerDisplay, timerContainer, startStopButton, isTimerRunning, seconds;

let isDragging = false;
let offsetX, offsetY;
// Listen for a message from the background script for timer updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Create the timer display and start/stop button container
  if (message.action === "updateTimerState") {
    if (message.initialState === true) {

      if (document.getElementById("timer-container")) {
        document.getElementById("timer-container").remove()
      }
      if (document.getElementById("start-stop-button")) {
        document.getElementById("start-stop-button").remove()
      }
      if (document.getElementById("done-button")) {
        document.getElementById("done-button").remove()
      } 

      console.log("Intital timer state")
      const timerContainer = document.createElement('div');
      timerContainer.id = 'timer-container';
      timerContainer.style.position = 'fixed';
      timerContainer.style.top = '400px';
      timerContainer.style.right = '10px';

      // Gradient background
      timerContainer.style.background = 'linear-gradient(to right, #1E90FF, #000000)';
      timerContainer.style.borderRadius = '10px';
      timerContainer.style.padding = '15px';
      timerContainer.style.boxShadow = '0px 0px 10px rgba(0, 0, 0, 0.5)';
      timerContainer.style.cursor = 'move'; // Set cursor to move

      document.body.appendChild(timerContainer);

      // HTML template

      // <button id="start-stop-button" style="padding: 8px 15px; cursor: pointer; background-color: #333333; color: #FFFFFF; border: none; border-radius: 5px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);">Stop</button>

      timerContainer.innerHTML = `
      <div id="elapsed-time" style="font-size: 18px; margin-bottom: 10px; color: #FFFFFF;">~0 mins</div>
      <div style="display: flex; justify-content: space-between;">
        <button id="done-button" style="padding: 8px 15px; cursor: pointer; background-color: #1E90FF; color: #FFFFFF; border: none; border-radius: 5px; box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.3);">Done</button>
      </div>
      `;

      // let startStopButton = document.getElementById("start-stop-button")
      //  startStopButton.addEventListener("click", () => {    
      //   chrome.runtime.sendMessage({
      //     action: "updateTimerState",
      //   });
      // });
        // Add an event listener to remove the timer element when the button is clicked
      let removeButton = document.getElementById("done-button")
      removeButton.addEventListener("click", () => {
        chrome.runtime.sendMessage({
          action: "removeTimer",
        });
      }); 
      window.addEventListener("mouseup", getText)
    }
    let elapsedTimeElement = document.getElementById("elapsed-time")
    let elapsedMinutes = message.time
    console.log("elapsed time in mins : ", elapsedMinutes)
    elapsedTimeElement.textContent = `~${elapsedMinutes} mins `;
  } else if (message.action === "removeTimer") {
    const timerContainer = document.getElementById("timer-container");
    if (timerContainer) {
      timerContainer.remove();
    }
    window.removeEventListener("mouseup", getText);

    chrome.runtime.sendMessage({
      action: "timerRemoved",
    });

    // Do a http request to server to input the final time and close the session
  } 
});

console.log("Content script injection ended!!")



  
  