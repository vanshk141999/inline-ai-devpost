// Listen for messages from the extension
chrome.runtime.onMessage.addListener(async (request) => {
  // get the settings from the background script
  // that are saved by the user
  const { isLicensed, model, llm } = await chrome.runtime.sendMessage({
    type: 'getSettings',
  })

  // check if the license key is added or not
  // if it is not added then show the onboarding toast
  if (!isLicensed) {
    showLoadingIndicator(
      'Please enter a license key 🔑 to use Inline AI. <span id="openLicensePage" style="color: blue; cursor: pointer;">Click here</span>',
      'error',
    )
    // Add a click listener to open the license page
    document.getElementById('openLicensePage').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'openLicensePage' })
    })
    return
  }

  // implementation for the gemini model particularly gemini-nano
  if (model === 'gemini' && llm === 'gemini-nano') {
    if (window.ai === undefined) {
      showOnboardingToast()
      return
    }
    {
      const { available } = await ai?.assistant?.capabilities()

      if (request.action === 'processText' && available && available === 'readily') {
        let activeElement = document.activeElement
        let currentDocument = document
        const { command, selectedText } = request
        let systemPrompt = ''
        let toastMessage = ''

        switch (command) {
          case 'run_prompt':
            systemPrompt = ''
            toastMessage = 'Running prompt'
            break
          case 'fix_grammar':
            systemPrompt = 'Please correct the Grammar of the following sentence: '
            toastMessage = 'Fixing grammar'
            break
          case 'translate_text':
            systemPrompt = 'Please translate the following text to English: '
            toastMessage = 'Translating to English'
            break
          default:
            console.error('Invalid command')
            return
        }

        // Check if inside an iframe
        if (activeElement.tagName === 'IFRAME') {
          currentDocument = activeElement.contentDocument || activeElement.contentWindow.document
          activeElement = currentDocument.activeElement
        }

        // Check if the selected text is in a contenteditable element
        if (selectedText && activeElement && activeElement.isContentEditable) {
          try {
            showLoadingIndicator(toastMessage)

            const prompt = systemPrompt + ' ' + selectedText

            const session = await ai.assistant.create()
            const stream = session.promptStreaming(prompt)
            const range = currentDocument.getSelection().getRangeAt(0)

            // add stop button in ai-loading-indicator div
            const indicator = document.getElementById('ai-loading-indicator')
            const stopButton = document.createElement('button')
            stopButton.textContent = 'Stop'
            stopButton.style.color = 'red'
            stopButton.style.border = 'none'
            stopButton.style.background = 'none'
            stopButton.addEventListener('click', () => {
              session.destroy()
              removeLoadingIndicator()
            })
            indicator.appendChild(stopButton)

            for await (const chunk of stream) {
              range.deleteContents()

              const textNode = currentDocument.createTextNode(chunk)
              range.insertNode(textNode)
              range.selectNodeContents(textNode)
            }
          } catch (error) {
            console.info('Inline AI:', error.message)
          } finally {
            removeLoadingIndicator()
          }
        }
        // Check if the selected text is in a contenteditable element or a textarea
        else if ((selectedText && activeElement) || activeElement.isContentEditable) {
          try {
            showLoadingIndicator(toastMessage)

            // get selected text from the current document
            const text = currentDocument.getSelection().toString()

            const prompt = systemPrompt + ' ' + text

            const range = currentDocument.getSelection().getRangeAt(0)

            const session = await ai.assistant.create()
            const stream = session.promptStreaming(prompt)

            // add stop button in ai-loading-indicator div
            const indicator = document.getElementById('ai-loading-indicator')
            const stopButton = document.createElement('button')
            stopButton.textContent = 'Stop'
            stopButton.style.color = 'red'
            stopButton.style.border = 'none'
            stopButton.style.background = 'none'
            stopButton.addEventListener('click', () => {
              session.destroy()
              removeLoadingIndicator()
            })
            indicator.appendChild(stopButton)

            for await (const chunk of stream) {
              // replace the selected text with the response
              if (
                document.activeElement.tagName === 'TEXTAREA' ||
                document.activeElement.tagName === 'DIV' ||
                document.activeElement.tagName === 'SPAN'
              ) {
                document.activeElement.value = chunk
              } else {
                range.deleteContents()
                const textNode = currentDocument.createTextNode(chunk)
                range.insertNode(textNode)
                range.selectNodeContents(textNode)
              }
            }
          } catch (error) {
            console.info('Inline AI:', error.message)
          }
        }
        // Check if the selected text is in a textarea or text input
        else if (
          selectedText &&
          activeElement &&
          (activeElement.tagName === 'TEXTAREA' ||
            (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))
        ) {
          try {
            showLoadingIndicator(toastMessage)

            const prompt = systemPrompt + ' ' + selectedText

            const session = await ai.assistant.create()
            const stream = session.promptStreaming(prompt)

            // add stop button in ai-loading-indicator div
            const indicator = document.getElementById('ai-loading-indicator')
            const stopButton = document.createElement('button')
            stopButton.textContent = 'Stop'
            stopButton.style.color = 'red'
            stopButton.style.border = 'none'
            stopButton.style.background = 'none'
            stopButton.addEventListener('click', () => {
              session.destroy()
              removeLoadingIndicator()
            })
            indicator.appendChild(stopButton)

            for await (const chunk of stream) {
              const start = activeElement.selectionStart
              const end = activeElement.selectionEnd
              activeElement.value =
                activeElement.value.substring(0, start) + chunk + activeElement.value.substring(end)
              activeElement.setSelectionRange(start, start + chunk.length)
            }
          } catch (error) {
            console.info('Inline AI: ', error.message)
          } finally {
            removeLoadingIndicator()
          }
        } else {
          showLoadingIndicator('No text selected or not in a valid input field', 'error')
        }

        removeLoadingIndicator()
      } else {
        showOnboardingToast()
        return
      }
    }
  }

  // implementation for the openai model
  if (model === 'openai') {
    if (request.action === 'processText') {
      let activeElement = document.activeElement
      let currentDocument = document
      const { command, selectedText } = request // capture the selected text from the message
      let systemPrompt = ''
      let toastMessage = ''

      switch (command) {
        case 'run_prompt':
          systemPrompt = ''
          toastMessage = 'Running prompt'
          break
        case 'fix_grammar':
          systemPrompt = 'Please correct the Grammar of the following sentence: '
          toastMessage = 'Fixing grammar'
          break
        case 'translate_text':
          systemPrompt = 'Please translate the following text to English: '
          toastMessage = 'Translating to English'
          break
        default:
          console.error('Invalid command')
          return
      }

      // Check if inside an iframe
      if (activeElement.tagName === 'IFRAME') {
        currentDocument = activeElement.contentDocument || activeElement.contentWindow.document
        activeElement = currentDocument.activeElement
      }

      // Capture text selection and pass it to requestOpenAIStream
      const selectedTextFromDocument = currentDocument.getSelection().toString()
      requestOpenAIStream(
        systemPrompt,
        selectedText || selectedTextFromDocument,
        selectedTextFromDocument,
      )

      removeLoadingIndicator()
    }
    return
  }

  // will integrate claude later
  // if (model === 'claude') {
  //   if (request.action === 'processText') {
  //     let activeElement = document.activeElement
  //     let currentDocument = document
  //     const { command, selectedText } = request // capture the selected text from the message
  //     let systemPrompt = ''
  //     let toastMessage = ''

  //     switch (command) {
  //       case 'run_prompt':
  //         systemPrompt = ''
  //         toastMessage = 'Running prompt'
  //         break
  //       case 'fix_grammar':
  //         systemPrompt = 'Please correct the Grammar of the following sentence: '
  //         toastMessage = 'Fixing grammar'
  //         break
  //       case 'translate_text':
  //         systemPrompt = 'Please translate the following text to English: '
  //         toastMessage = 'Translating to English'
  //         break
  //       default:
  //         console.error('Invalid command')
  //         return
  //     }

  //     // Check if inside an iframe
  //     if (activeElement.tagName === 'IFRAME') {
  //       currentDocument = activeElement.contentDocument || activeElement.contentWindow.document
  //       activeElement = currentDocument.activeElement
  //     }

  //     // Capture text selection and pass it to requestOpenAIStream
  //     const selectedTextFromDocument = currentDocument.getSelection().toString()
  //     requestClaudeStream(
  //       systemPrompt,
  //       selectedText || selectedTextFromDocument,
  //       selectedTextFromDocument,
  //     )

  //     removeLoadingIndicator()
  //   }
  //   return
  // }
})

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  let toastMessage = 'Running prompt'

  if (message.action === 'streamChunk') {
    let activeElement = document.activeElement
    let currentDocument = document
    const selectedText = message.selectedText // Ensure selectedText is passed from background
    console.log('message.selectedText', message.selectedText) // Log the selected text

    // for (const chunk of message.chunk) {
    //   console.log('chunk', message.chunk)
    // }

    if (activeElement.tagName === 'IFRAME') {
      currentDocument = activeElement.contentDocument || activeElement.contentWindow.document
      activeElement = currentDocument.activeElement
    }

    if (message.chunk) {
      await chrome.runtime.sendMessage({ action: 'openSidePanel', content: message.chunk })
      // if (selectedText && activeElement && activeElement.isContentEditable) {
      //   try {
      //     console.log('1')

      //     showLoadingIndicator(toastMessage)
      //     const range = currentDocument.getSelection().getRangeAt(0)
      //     range.deleteContents() // Clear the selected text

      //     const textNode = currentDocument.createTextNode('')
      //     range.insertNode(textNode)
      //     range.selectNodeContents(textNode)

      //     textNode.textContent += message.chunk // Append the streamed chunk
      //     range.setEndAfter(textNode)
      //   } catch (error) {
      //     console.info('Inline AI:', error.message)
      //   } finally {
      //     removeLoadingIndicator()
      //   }
      // } else if (
      //   selectedText &&
      //   activeElement &&
      //   (activeElement.tagName === 'TEXTAREA' ||
      //     (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))
      // ) {
      //   try {
      //     console.log('2')

      //     showLoadingIndicator(toastMessage)
      //     const start = activeElement.selectionStart
      //     const end = activeElement.selectionEnd

      //     const beforeSelection = activeElement.value.substring(0, start)
      //     const afterSelection = activeElement.value.substring(end)

      //     activeElement.value = beforeSelection + message.chunk + afterSelection
      //     activeElement.setSelectionRange(
      //       beforeSelection.length + message.chunk.length,
      //       beforeSelection.length + message.chunk.length,
      //     )
      //   } catch (error) {
      //     console.info('Inline AI:', error.message)
      //   } finally {
      //     removeLoadingIndicator()
      //   }
      // }

      if (selectedText && activeElement && activeElement.isContentEditable) {
        try {
          console.log('1')
          const range = currentDocument.getSelection().getRangeAt(0)

          // check if there is existing loading indicator then append the message.chunk in it
          if (document.getElementById('ai-loading-indicator')) {
            const indicator = document.getElementById('ai-loading-indicator')
            const messageNode = indicator.getElementsByTagName('span')[1]
            messageNode.innerHTML += message.chunk
            // indicator.appendChild(message)
            return
          } else {
            showLoadingIndicator(message.chunk)
          }

          // add stop button in ai-loading-indicator div
          const indicator = document.getElementById('ai-loading-indicator')
          const stopButton = document.createElement('button')
          stopButton.textContent = 'Insert'
          stopButton.style.color = 'red'
          stopButton.style.border = 'none'
          stopButton.style.background = 'none'
          stopButton.addEventListener('click', () => {
            const indicator = document.getElementById('ai-loading-indicator')
            const messageNode = indicator.getElementsByTagName('span')[1]
            const textNode = currentDocument.createTextNode(messageNode.innerHTML.toString())
            range.deleteContents()
            range.insertNode(textNode)
            range.selectNodeContents(textNode)
            indicator.remove()
          })
          indicator.appendChild(stopButton)
        } catch (error) {
          console.info('Inline AI:', error.message)
        } finally {
        }
      } else if (
        // Check if the selected text is in a textarea or text input
        selectedText &&
        activeElement &&
        (activeElement.tagName === 'TEXTAREA' ||
          (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))
      ) {
        try {
          console.log('2')
          showLoadingIndicator(toastMessage)
          const start = activeElement.selectionStart
          const end = activeElement.selectionEnd

          const beforeSelection = activeElement.value.substring(0, start)
          const afterSelection = activeElement.value.substring(end)

          activeElement.value = beforeSelection + message.chunk + afterSelection
          activeElement.setSelectionRange(
            beforeSelection.length + message.chunk.length,
            beforeSelection.length + message.chunk.length,
          )
        } catch (error) {
          console.info('Inline AI:', error.message)
        } finally {
          removeLoadingIndicator()
        }
      } else if (selectedText && activeElement) {
        try {
          console.log('3')
          showLoadingIndicator(toastMessage)
          const range = currentDocument.getSelection().getRangeAt(0)
          range.deleteContents() // Clear the selected text

          const textNode = currentDocument.createTextNode('')
          range.insertNode(textNode)
          range.selectNodeContents(textNode)

          textNode.textContent += message.chunk // Append the streamed chunk
          range.setEndAfter(textNode)
        } catch (error) {
          console.info('Inline AI:', error.message)
        } finally {
          removeLoadingIndicator()
        }
      } else {
        showLoadingIndicator('No text selected or not in a valid input field', 'error')
      }
    }
  }

  if (message.action === 'streamComplete') {
    console.log('Streaming complete:', message.fullResponse)
    removeLoadingIndicator()
  }

  if (message.action === 'streamError') {
    console.error('Streaming error:', message.error)
    removeLoadingIndicator()
  }
})

function requestOpenAIStream(systemPrompt, selectedText, originalText) {
  // Ensure selectedText is passed and exists
  const selection = window.getSelection()
  const selectedTextFromPage = selection && selection.toString()
  const finalSelectedText = selectedText || selectedTextFromPage || originalText

  // If no text is selected, exit
  if (!finalSelectedText) {
    showLoadingIndicator('No text selected', 'error')
    console.log('No text selected')
    return
  }

  const prompt = systemPrompt + ' ' + finalSelectedText

  chrome.runtime.sendMessage({
    action: 'getOpenAIResponse',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: finalSelectedText },
    ],
    selectedText,
  })
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  let toastMessage = 'Running prompt'

  if (message.action === 'claudeStreamChunk') {
    let activeElement = document.activeElement
    let currentDocument = document
    const selectedText = message.selectedText

    if (activeElement.tagName === 'IFRAME') {
      currentDocument = activeElement.contentDocument || activeElement.contentWindow.document
      activeElement = currentDocument.activeElement
    }

    if (message.chunk) {
      if (selectedText && activeElement && activeElement.isContentEditable) {
        try {
          console.log('1')
          const range = currentDocument.getSelection().getRangeAt(0)

          // check if there is existing loading indicator then append the message.chunk in it
          if (document.getElementById('ai-loading-indicator')) {
            const indicator = document.getElementById('ai-loading-indicator')
            const messageNode = indicator.getElementsByTagName('span')[1]
            messageNode.innerHTML += message.chunk
            // indicator.appendChild(message)
            return
          } else {
            showLoadingIndicator(message.chunk)
          }

          // add stop button in ai-loading-indicator div
          const indicator = document.getElementById('ai-loading-indicator')
          const stopButton = document.createElement('button')
          stopButton.textContent = 'Insert'
          stopButton.style.color = 'red'
          stopButton.style.border = 'none'
          stopButton.style.background = 'none'
          stopButton.addEventListener('click', () => {
            const indicator = document.getElementById('ai-loading-indicator')
            const messageNode = indicator.getElementsByTagName('span')[1]
            const textNode = currentDocument.createTextNode(messageNode.innerHTML.toString())
            range.deleteContents()
            range.insertNode(textNode)
            range.selectNodeContents(textNode)
            indicator.remove()
          })
          indicator.appendChild(stopButton)
        } catch (error) {
          console.info('Inline AI:', error.message)
        } finally {
        }
      } else if (
        // Check if the selected text is in a textarea or text input
        selectedText &&
        activeElement &&
        (activeElement.tagName === 'TEXTAREA' ||
          (activeElement.tagName === 'INPUT' && activeElement.type === 'text'))
      ) {
        try {
          console.log('2')
          showLoadingIndicator(toastMessage)
          const start = activeElement.selectionStart
          const end = activeElement.selectionEnd

          const beforeSelection = activeElement.value.substring(0, start)
          const afterSelection = activeElement.value.substring(end)

          activeElement.value = beforeSelection + message.chunk + afterSelection
          activeElement.setSelectionRange(
            beforeSelection.length + message.chunk.length,
            beforeSelection.length + message.chunk.length,
          )
        } catch (error) {
          console.info('Inline AI:', error.message)
        } finally {
          removeLoadingIndicator()
        }
      } else if (selectedText && activeElement) {
        try {
          console.log('3')
          showLoadingIndicator(toastMessage)
          const range = currentDocument.getSelection().getRangeAt(0)
          range.deleteContents() // Clear the selected text

          const textNode = currentDocument.createTextNode('')
          range.insertNode(textNode)
          range.selectNodeContents(textNode)

          textNode.textContent += message.chunk // Append the streamed chunk
          range.setEndAfter(textNode)
        } catch (error) {
          console.info('Inline AI:', error.message)
        } finally {
          removeLoadingIndicator()
        }
      } else {
        showLoadingIndicator('No text selected or not in a valid input field', 'error')
      }
    }
  }

  if (message.action === 'streamComplete') {
    console.log('Streaming complete:', message.fullResponse)
    removeLoadingIndicator()
  }

  if (message.action === 'streamError') {
    console.error('Streaming error:', message.error)
    removeLoadingIndicator()
  }
})

function requestClaudeStream(systemPrompt, selectedText, originalText) {
  // Ensure selectedText is passed and exists
  const selection = window.getSelection()
  const selectedTextFromPage = selection && selection.toString()
  const finalSelectedText = selectedText || selectedTextFromPage || originalText

  // If no text is selected, exit
  if (!finalSelectedText) {
    showLoadingIndicator('No text selected', 'error')
    console.log('No text selected')
    return
  }

  const prompt = systemPrompt + ' ' + finalSelectedText

  console.log('requestClaudeStream')

  chrome.runtime.sendMessage({
    action: 'getClaudeResponse',
    messages: [
      // { role: 'system', content: systemPrompt },
      { role: 'user', content: finalSelectedText },
    ],
    systemPrompt: systemPrompt,
    selectedText,
  })
}

// Show a loading indicator with animation and improved UI
function showLoadingIndicator(toastMessage, type = 'success') {
  const indicator = document.createElement('div')
  indicator.id = 'ai-loading-indicator'
  indicator.style.position = 'fixed'
  indicator.style.top = '10px'
  indicator.style.right = '-300px'
  indicator.style.padding = '10px'
  indicator.style.display = 'flex'
  indicator.style.alignItems = 'center'
  indicator.style.justifyContent = 'space-between'
  indicator.style.backgroundColor = '#333'
  indicator.style.color = 'white'
  indicator.style.zIndex = '9999'
  indicator.style.borderRadius = '5px'
  indicator.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.5)'
  indicator.style.transition = 'right 0.5s ease-out'

  const icon = document.createElement('span')
  icon.style.marginRight = '10px'
  switch (type) {
    case 'success':
      indicator.style.borderLeft = '5px solid #4CAF50'
      break
    case 'error':
      indicator.style.borderLeft = '5px solid #F44336'
      indicator.style.backgroundColor = 'white'
      indicator.style.color = 'black'
      break
    case 'warning':
      indicator.style.borderLeft = '5px solid #FFC107'
      break
    case 'info':
    default:
      indicator.style.borderLeft = '5px solid #2196F3'
      break
  }

  const message = document.createElement('span')
  message.innerHTML = toastMessage

  indicator.appendChild(icon)
  indicator.appendChild(message)
  document.body.appendChild(indicator)

  // Trigger the animation
  requestAnimationFrame(() => {
    indicator.style.right = '10px'
  })
}

// Remove the loading indicator
function removeLoadingIndicator() {
  const indicator = document.getElementById('ai-loading-indicator')
  if (indicator) {
    // Add a slide-out animation before removing the indicator
    indicator.style.right = '-300px'
    setTimeout(() => {
      indicator.remove()
    }, 500)
  }
}

// Onboarding Toast
function showOnboardingToast() {
  showLoadingIndicator(
    `<div style="font-size: 14px">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <h4>Please complete the following steps to use Inline AI - </h4>
          <span class="iai-onboarding-close"style="color:red; cursor:pointer; position:absolute; right:6px; top:1px;">x</span>
        </div>
        <ol>
          <li>Please make sure you are using Chrome (<a target="_blank" href="https://www.google.com/chrome/dev/?extra=devchannel">Dev</a> / <a target="_blank" href="https://www.google.com/chrome/canary/">Canary</a>) version <code>128.0.6545.0</code> or higher.</li>
          <li>Go to <code>chrome://flags/#prompt-api-for-gemini-nano</code> and enable the Prompt API for Gemini Nano option.</li>
          <li>Go to <code>chrome://flags/#optimization-guide-on-device-model</code> and turn on the Enables optimization guide on device option.</li>
          <li>Go to <code>chrome://components/</code> and check or download the latest version of Optimization Guide On Device Model.</li>
        </ol>
      </div>`,
    'error',
  )

  document.querySelector('.iai-onboarding-close').addEventListener('click', () => {
    const indicator = document.getElementById('ai-loading-indicator')
    indicator.remove()
  })
}
