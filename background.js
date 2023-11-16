chrome.runtime.onInstalled.addListener(async () => {
  const manifest = chrome.runtime.getManifest();

  for (const contentScript of manifest.content_scripts) {
    const tabs = await chrome.tabs.query({ url: contentScript.matches });

    for (const tab of tabs) {
      // Inject the content script into the matching tabs
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: contentScript.js,
      });
    }
  }
});
