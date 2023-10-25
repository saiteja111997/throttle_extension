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
  // cameraButton.style.display = "inline-block"; // Make it an inline block
  // cameraButton.style.width = "40px"; // Adjust the width as needed
  // cameraButton.style.height = "40px"; // Adjust the height as needed
  // cameraButton.style.textAlign = "center"; // Center text
  // cameraButton.style.lineHeight = "40px"; // Center text vertically
  // cameraButton.style.color = "Black"; // Button text color
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

    // Create the timer display
    const timerDisplay = document.createElement("div");
    timerDisplay.id = "timer";
    timerDisplay.style.fontSize = "20px";
    timerDisplay.style.textAlign = "center";
    timerDisplay.textContent = "00:00:00";
  
    // Append the elements to the input container
  inputContainer.appendChild(searchInput);
  inputContainer.appendChild(cameraButton);
  inputContainer.appendChild(screenshotInput);
  inputContainer.appendChild(searchButton);

  // Add the timer display to the search bar
  searchBar.appendChild(timerDisplay);
  
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
    chrome.runtime.sendMessage({ action: "performSearch", searchText });
    // Remove both the overlay and the search bar
    overlay.remove();
    searchBar.remove();

    // Create the timer display and start/stop button container
    const timerContainer = createTimerContainer();
    const timerDisplay = createTimerDisplay(timerContainer);
    const startStopButton = createStartStopButton(timerContainer);
    let isTimerRunning = false;
    let seconds = 0;

    startStopButton.addEventListener("click", () => {
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
    });

    document.body.appendChild(timerContainer);


  });

  function updateTimerDisplay(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    document.getElementById('timer').textContent = formattedTime;
  }

  function createTimerContainer() {
    const timerContainer = document.createElement("div");
    timerContainer.id = "timerContainer";
    timerContainer.style.position = "fixed";
    timerContainer.style.top = "50px"; // Adjust the top position as needed
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

  
  }
  
  
  
  
  