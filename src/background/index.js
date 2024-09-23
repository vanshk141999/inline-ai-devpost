chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getSettings') {
    chrome.storage.sync.get(
      ['iai_license_key', 'iai_model', 'iai_llm', 'iai_api_key'],
      (result) => {
        const isLicensed = result.iai_license_key ? true : false
        const model = result.iai_model || 'gemini'
        const llm = result.iai_llm || 'gemini-nano'
        const apiKey = result.iai_api_key || ''
        sendResponse({ isLicensed, model, llm, apiKey }) // Send the license key back to the content script
      },
    )
    return true // Required to indicate that sendResponse will be called asynchronously
  }

  if (request.type === 'openLicensePage') {
    chrome.tabs.create({ url: chrome.runtime.getURL('options.html') + '?id=manageLicense' })
  }

  // if (request.type === 'openSidePanel') {
  //   console.log('Opening side panel...')
  //   // open side panel html
  //   chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  //     chrome.sidePanel.open(tabs[0].id)
  //   })
  // }

  // if (request.type === 'getAllShortcuts') {
  //   chrome.commands.getAll((commands) => {
  //     sendResponse(commands)
  //   })
  //   return true
  // }
})

// manage shortcuts
chrome.commands.onCommand.addListener((command) => {
  if (command === 'options_page') {
    chrome.runtime.openOptionsPage()
  }
})

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === 'getOpenAIResponse') {
    chrome.storage.sync.get(['iai_api_key', 'iai_llm'], async (result) => {
      const apiKey = result.iai_api_key || ''
      const modelLlm = result.iai_llm || 'gpt-4'

      if (!apiKey) {
        sendResponse({ error: 'API key not found' })
        return
      }

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelLlm,
            messages: message.messages,
            stream: true, // Enable streaming
          }),
        })

        if (!response.ok) {
          throw new Error('OpenAI API request failed')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder('utf-8')
        let done = false
        let fullResponse = ''
        let buffer = ''

        while (!done) {
          const { value, done: streamDone } = await reader.read()
          done = streamDone
          const chunk = decoder.decode(value, { stream: true })
          buffer += chunk

          // Process buffer to extract complete JSON objects
          let endIndex
          while ((endIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, endIndex).trim()
            buffer = buffer.slice(endIndex + 1)

            if (line) {
              try {
                const json = JSON.parse(line.replace(/^data: /, ''))
                const content = json.choices[0].delta.content
                fullResponse += content

                // Send each chunk to the content script with selected text
                chrome.tabs.sendMessage(sender.tab.id, {
                  action: 'streamChunk',
                  chunk: content,
                  selectedText: message.selectedText, // Pass selected text back
                })
              } catch (e) {
                console.error('Error parsing JSON:', e)
              }
            }
          }
        }

        // chrome.tabs.sendMessage(sender.tab.id, { action: 'streamComplete', fullResponse })
      } catch (error) {
        console.error('Error in background script:', error)
        chrome.tabs.sendMessage(sender.tab.id, { action: 'streamError', error: error.message })
      }
    })
  }

  if (message.action === 'getClaudeResponse') {
    chrome.storage.sync.get(['iai_api_key'], async (result) => {
      const apiKey = result.iai_api_key || ''
      const modelLlm = result.iai_llm || 'claude-3-5-sonnet-20240620'

      if (!apiKey) {
        sendResponse({ error: 'API key not found' })
        return
      }

      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey, // Replace with your actual API key if not using env variable
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: modelLlm,
            max_tokens: 256,
            messages: message.messages,
            system: message.systemPrompt,
            // stream: true, // Enable streaming
          }),
        })

        if (!response.ok) {
          throw new Error('Claude API request failed')
        }

        // const reader = response.body.getReader()
        // const decoder = new TextDecoder('utf-8')
        // let done = false
        // let fullResponse = ''
        // let buffer = ''

        // while (!done) {
        //   const { value, done: streamDone } = await reader.read()
        //   done = streamDone
        //   const chunk = decoder.decode(value, { stream: true })
        //   buffer += chunk

        //   // Process buffer to extract complete JSON objects
        //   let endIndex
        //   while ((endIndex = buffer.indexOf('\n')) >= 0) {
        //     const line = buffer.slice(0, endIndex).trim()
        //     buffer = buffer.slice(endIndex + 1)

        //     if (line) {
        //       try {
        //         const json = JSON.parse(line.replace(/^data: /, ''))
        //         const content = json.choices[0].delta.content
        //         fullResponse += content

        //         // Send each chunk to the content script with selected text
        //         chrome.tabs.sendMessage(sender.tab.id, {
        //           action: 'claudeStreamChunk',
        //           chunk: content,
        //           selectedText: message.selectedText, // Pass selected text back
        //         })
        //       } catch (e) {
        //         console.error('Error parsing JSON:', e)
        //       }
        //     }
        //   }
        // }

        // just send the whole response back
        const fullResponse = await response.json()
        chrome.tabs.sendMessage(sender.tab.id, { action: 'claudeStreamChunk', chunk: fullResponse })
        // chrome.tabs.sendMessage(sender.tab.id, { action: 'streamComplete', fullResponse })
      } catch (error) {
        console.error('Error in background script:', error)
        chrome.tabs.sendMessage(sender.tab.id, { action: 'streamError', error: error.message })
      }
    })

    // return true
  }
})

// Function to process the raw chunk (if necessary, otherwise pass chunk as is)
function processChunk(chunk) {
  // OpenAI responses typically come in a 'data:' format, so remove 'data: ' prefix and filter empty lines
  const processed = chunk
    .split('\n')
    .filter((line) => line.trim() !== '' && !line.startsWith('[DONE]'))
    .map((line) => JSON.parse(line.replace(/^data: /, '')))
  return processed.map((c) => c.choices[0].delta.content).join('')
}

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'run_prompt',
    title: 'Run AI Prompt',
    contexts: ['editable', 'selection'],
  })

  chrome.contextMenus.create({
    id: 'fix_grammar',
    title: 'Fix Grammar',
    contexts: ['editable', 'selection'],
  })

  chrome.contextMenus.create({
    id: 'translate_text',
    title: 'Translate Text',
    contexts: ['editable', 'selection'],
  })
})

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText

  if (info.menuItemId === 'run_prompt') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'processText',
        command: 'run_prompt',
        selectedText: selectedText,
      })
    })
  } else if (info.menuItemId === 'fix_grammar') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'processText',
        command: 'fix_grammar',
        selectedText: selectedText,
      })
    })
  } else if (info.menuItemId === 'translate_text') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'processText',
        command: 'translate_text',
        selectedText: selectedText,
      })
    })
  }
})

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error))
