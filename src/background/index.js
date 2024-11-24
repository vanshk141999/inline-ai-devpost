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
chrome.contextMenus.onClicked.addListener(async (info) => {
  const selectedText = info.selectionText

  if (info.menuItemId === 'inline_ai_activate') {
    // Open side panel
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0].id

      chrome.sidePanel.setOptions({
        tabId,
        path: 'sidePanel.html',
        enabled: true,
      })

      await chrome.sidePanel.open({ tabId })

      // Send the selected text through the port
      setTimeout(() => {
        // Establish a persistent connection
        const port = chrome.runtime.connect({ name: 'sidePanelConnection' })
        if (!port) {
          return
        }
        port.postMessage({ type: 'getSelectedText', selectedText })
      }, 1000)
    })
  }
})

// add support for shortcut key options_page
chrome.commands.onCommand.addListener((command) => {
  if (command === 'options_page') {
    chrome.runtime.openOptionsPage()
  }

  if (command === 'selected_text_to_side_panel') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tabId = tabs[0].id

      chrome.sidePanel.setOptions({
        tabId,
        path: 'sidePanel.html',
        enabled: true,
      })

      await chrome.sidePanel.open({ tabId })

      // Send the selected text through the port
      setTimeout(() => {
        // Establish a persistent connection
        const port = chrome.runtime.connect({ name: 'sidePanelConnection' })
        if (!port) {
          return
        }
        port.postMessage({ type: 'getSelectedText', selectedText })
      }, 1000)
    })
  }
})

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))
