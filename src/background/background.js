chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: 'popup/popup.html' })
})
