// get settings from storage
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSettings') {
    chrome.storage.sync.get(['iai_model', 'iai_llm', 'iai_prompt_list'], (result) => {
      const model = result.iai_model || 'gemini'
      const llm = result.iai_llm || 'gemini-nano'
      const promptList = result.iai_prompt_list || []
      sendResponse({ model, llm, promptList }) // Send the license key back to the content script
    })
    return true // Required to indicate that sendResponse will be called asynchronously
  }
})

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'inline_ai_activate',
    title: 'Run With Inline AI',
    contexts: ['editable', 'selection'],
  })

  chrome.contextMenus.create({
    id: 'inline_ai_open',
    parentId: 'inline_ai_activate',
    title: 'Open',
    contexts: ['editable', 'selection'],
  })

  chrome.contextMenus.create({
    id: 'inline_ai_summarize',
    parentId: 'inline_ai_activate',
    title: 'Summarize',
    contexts: ['editable', 'selection'],
  })

  // save iai_prompt_list to storage initial value
  chrome.storage.sync.set(
    {
      iai_prompt_list: [
        {
          id: 2,
          name: 'Reply',
          prompt:
            'Craft a thoughtful response to the given chat message, social media post, comment, or email, ensuring it matches the tone and sentiment of the original message.',
        },
        {
          id: 3,
          name: 'Translate',
          prompt:
            'Translate the provided text into English while maintaining the original meaning and tone.',
        },
        {
          id: 4,
          name: 'CopyWrite',
          prompt:
            'Create compelling and persuasive marketing copy based on the given product description. The result should engage and inform the target audience, highlighting key features and benefits.',
        },
        {
          id: 5,
          name: 'Explain',
          prompt:
            'Provide detailed insights and explanations for the given keywords, data, or topic, offering valuable information and clarifying complex points.',
        },
        {
          id: 6,
          name: 'Inspire',
          prompt:
            'Generate creative ideas or inspiration based on the provided text to help spark new thoughts or approaches.',
        },
        {
          id: 7,
          name: 'Reword',
          prompt:
            'Generate a clearer, simpler, and more concise version of the given text that is easy to read and understand.',
        },
      ],
    },
    () => {},
  )
})

// get selected text to SidePanel
// Helper function to open the side panel and send selected text through a port
async function openSidePanelAndSendText(tabId, selectedText, promptName = '') {
  // Set up the side panel options
  chrome.sidePanel.setOptions({
    tabId,
    path: 'sidePanel.html',
    enabled: true,
  })

  // Open the side panel
  await chrome.sidePanel.open({ tabId })

  // Wait a moment before establishing the connection
  setTimeout(() => {
    const port = chrome.runtime.connect({ name: 'sidePanelConnection' })
    if (!port) {
      return
    }

    // Send the selected text
    port.postMessage({ type: 'getSelectedText', selectedText })

    // If a promptName is provided, send it as well
    if (promptName) {
      port.postMessage({ type: 'promptName', promptName })
    }
  }, 1000)
}

// Listener for context menu clicks
chrome.contextMenus.onClicked.addListener(async (info) => {
  const selectedText = info.selectionText

  if (info.menuItemId) {
    // Get the active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0].id

      // Open the side panel and send the selected text (with or without a prompt name)
      let promptName = ''
      switch (info.menuItemId) {
        case 'inline_ai_summarize':
          promptName = 'Summarize'
          break
        default:
          promptName = ''
          break
      }

      await openSidePanelAndSendText(tabId, selectedText, promptName)
    })
  }
})

// add support for shortcut key options_page
chrome.commands.onCommand.addListener((command) => {
  if (command === 'options_page') {
    chrome.runtime.openOptionsPage()
  }
})

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))
