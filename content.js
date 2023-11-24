// content.js

// Listen for a message from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "showSearchBar") {
      console.log("Calling the search bar function !!")
      showSearchBar();
    }
  });
  
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
    searchInput.style.background = "linear-gradient(to right, skyblue, white)"; // Blue-white linear gradient
    searchInput.style.backgroundColor = "white";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.padding = "20px";
    searchInput.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";

    
     // Create the camera button (input type file)
    const cameraButton = document.createElement("label");
    cameraButton.htmlFor = "screenshotInput";
    cameraButton.style.cursor = "pointer"; // Change cursor to pointer
  

    iconUrl = chrome.runtime.getURL("images/camera.png");
    cameraButton.innerHTML =  '<img src = iconUrl alt="Camera">';
    const screenshotInput = document.createElement("input");
    screenshotInput.type = "file";
    screenshotInput.id = "screenshotInput";
    screenshotInput.accept = "image/*"; // Accept image files
    screenshotInput.style.display = "none"; // Hide the file input
    screenshotInput.addEventListener("change", (event) => {
      // Handle the selected file here (event.target.files[0] contains the file)
      const selectedFile = event.target.files[0];
      if (selectedFile) {
        // You can do something with the selected file here
        console.log("Selected file:", selectedFile);
      }
    });

  
    // Create the search button
    const searchButton = document.createElement("button");
    searchButton.id = "searchButton";
    searchButton.textContent = "Go!!";
    searchButton.style.borderRadius = "50px"; // Rounded button
    searchButton.style.backgroundColor = "skyblue"; // Button background color
    searchButton.style.color = "Black"; // Button text color
    searchButton.style.padding = "20px"; // Adjust the padding as needed
    searchButton.style.border = "1px solid #ccc";
    searchButton.style.boxShadow = "0px 0px 10px rgba(0, 0, 0, 0.5)";

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

    // Append the selected image files to the FormData
    const screenshotInput = document.getElementById("screenshotInput");
    if (screenshotInput.files.length > 0) {
      for (let i = 0; i < screenshotInput.files.length; i++) {
        const file = screenshotInput.files[i];
        formData.append("images", file);
      }
    }

    // Send a POST request to your backend server (example.com)
    // try {
    //   const response = await fetch("https://example.com/your-upload-endpoint", {
    //     method: "POST",
    //     body: formData,
    //   });

    //   if (response.ok) {
    //     // Request was successful
    //     const responseData = await response.json();
    //     console.log("Response from server:", responseData);
    //   } else {
    //     // Request failed
    //     console.error("Request failed with status:", response.status);
    //   }
    // } catch (error) {
    //   // Handle any network errors
    //   console.error("Network error:", error);
    // }


    event.stopPropagation(); // Prevent the click event from propagating to the overlay
    // You can perform some action with the entered search text here
    // For example, send it to the background script to process
    // chrome.runtime.sendMessage({ action: "performSearch", searchText });
    // Notify the background script to update the timer state
    console.log("Sending message to background script!!")
    chrome.runtime.sendMessage({
      action: "updateTimerState",
      timerState: false,
      seconds : 0,
      initialState: true
    });
    // Remove both the overlay and the search bar
    overlay.remove();
    searchBar.remove();
  });
}
  


let timerDisplay, timerContainer, startStopButton, isTimerRunning, seconds, timerInterval ;

// Listen for a message from the background script for timer updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Create the timer display and start/stop button container

  if (message.action === "updateTimerState") {

    if (message.initialState === true) {
       
      var currentdate = new Date();
       console.log("Message received at : ", currentdate.getTime())

       timerContainer = createTimerContainer();
       timerDisplay = createTimerDisplay(timerContainer);
       startStopButton = createStartStopButton(timerContainer);
       const removeButton = createRemoveButton(timerContainer);
       document.body.appendChild(timerContainer);

       startStopButton.addEventListener("click", () => {    
        chrome.runtime.sendMessage({
          action: "updateTimerState",
          timerState: isTimerRunning,
          seconds: seconds,
          initialState: false
        });
      });

         // Add an event listener to remove the timer element when the button is clicked
        removeButton.addEventListener("click", () => {
          chrome.runtime.sendMessage({
            action: "removeTimer",
            seconds: seconds,
          });
        }); 

    }
    isTimerRunning = message.timerState;
    seconds = message.seconds;

    console.log("Value of initialState : ", message.initialState)
    console.log("Timer state : ",isTimerRunning )

    if (message.initialState === true) {
          // Start the timer
          timerInterval = setInterval(() => {
            seconds++;
            updateTimerDisplay(seconds, timerDisplay);
          }, 1000);
          isTimerRunning = true;
          startStopButton.textContent = "Stop"; // Change button text to "Stop" when starting  
    } else {
      if (isTimerRunning) {
        clearInterval(timerInterval);
        isTimerRunning = false;
        startStopButton.textContent = "Start"; // Change button text to "Start" when stopping
      } else {
        // Start the timer
        timerInterval = setInterval(() => {
          seconds++;
          updateTimerDisplay(seconds, timerDisplay);
        }, 1000);
        isTimerRunning = true;
        startStopButton.textContent = "Stop"; // Change button text to "Stop" when starting
      }
    }
  } else if (message.action === "removeTimer") {
    const timerContainer = document.getElementById("timerContainer");
    if (timerContainer) {
      timerContainer.remove();
    }
    const timer = document.getElementById("timer")
    if (timer) {
      timer.remove()
    }

    chrome.runtime.sendMessage({
      action: "timerRemoved",
    });

    // Do a http request to server to input the final time and close the session

  }

  function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    const timer = document.getElementById("timer")
    if (timer) {
      timer.textContent = formattedTime;
    }
  }
  
  function createTimerContainer() {
    const timerContainer = document.createElement("div");
    timerContainer.id = "timerContainer";
    timerContainer.style.position = "fixed";
    timerContainer.style.top = "90px"; // Adjust the top position as needed
    timerContainer.style.right = "10px"; // Adjust the right position as needed
    timerContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    timerContainer.style.borderRadius = "10px";
    timerContainer.style.padding = "10px";
    timerContainer.style.display = "flex";
    timerContainer.style.alignItems = "center";
    return timerContainer;
  }
  
  function createTimerDisplay(container) {
    const timerDisplay = document.createElement("div");
    timerDisplay.id = "timer";
    timerDisplay.style.fontSize = "20px";
    timerDisplay.style.marginRight = "10px"; // Add spacing between timer and button
    container.appendChild(timerDisplay);
    return timerDisplay;
  }
  
  function createStartStopButton(container) {
    const startStopButton = document.createElement("button");
    startStopButton.id = "startStopButton";
    startStopButton.textContent = "Start";
    startStopButton.style.borderRadius = "5px";
    startStopButton.style.backgroundColor = "skyblue";
    startStopButton.style.color = "Black";
    startStopButton.style.cursor = "pointer";
    container.appendChild(startStopButton);
    return startStopButton;
  }

  function createRemoveButton(container) {
    const removeButton = document.createElement("button");
    removeButton.id = "removeButton";
    removeButton.textContent = "Done";
    removeButton.style.borderRadius = "5px";
    removeButton.style.backgroundColor = "tomato";
    removeButton.style.color = "white";
    removeButton.style.cursor = "pointer";
    container.appendChild(removeButton);
    return removeButton;
  }

});



  
  