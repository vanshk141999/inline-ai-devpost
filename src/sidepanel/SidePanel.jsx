import React, { useState, useEffect } from 'react'
import { FaUser, FaWandMagicSparkles, FaGear } from 'react-icons/fa6'
import { BsCopy, BsCheck2All } from 'react-icons/bs'
import { IoMdSend, IoMdRefresh } from 'react-icons/io'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

// Custom Button component
const Button = ({ children, onClick, className = '', type = 'button' }) => (
  <button
    type={type}
    onClick={onClick}
    className={`px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-0 ${className}`}
  >
    {children}
  </button>
)

// Custom Select component
const Select = ({ value, onChange, options }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="bg-white border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-0"
  >
    {options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))}
  </select>
)

// Custom Textarea component
const Textarea = ({ value, onChange, placeholder, onKeyDown }) => (
  <textarea
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    onKeyDown={onKeyDown}
    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-0 bg-white"
    rows={2}
  />
)

export const SidePanel = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I assist you today?', sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [copiedMessageId, setCopiedMessageId] = useState(null)
  const [loadingMessageId, setLoadingMessageId] = useState(null)
  const [session, setSession] = useState(null)
  const [available, setAvailable] = useState(null)
  const [responseType, setResponseType] = useState('Reply')
  const [promptList, setPromptList] = useState([])
  const [responseTypePrompt, setResponseTypePrompt] = useState('')
  const [responseLength, setResponseLength] = useState('Short')

  const getSettings = async () => {
    const { isLicensed, model, llm, promptList, apiKey } = await chrome.runtime.sendMessage({
      type: 'getSettings',
    })
    return { isLicensed, model, llm, promptList, apiKey }
  }

  // set promptList to the state
  useEffect(() => {
    getSettings().then(({ promptList }) => {
      setPromptList(promptList)
    })
  }, [])

  console.log(promptList)

  const createGeminiSession = async () => {
    const { available } = await ai?.assistant?.capabilities()
    const session = await ai.assistant.create()
    return { session, available }
  }

  const destroyGeminiSession = async () => {
    if (session) {
      await session.destroy()
      setSession(null)
    }
  }

  useEffect(() => {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidePanelConnection') {
        port.onMessage.addListener((msg) => {
          if (msg.type === 'getSelectedText') {
            setInput(msg.selectedText)
            console.log('Received selected text:', msg.selectedText)
          }
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!window.ai) {
      return
    }

    createGeminiSession().then(({ session, available }) => {
      setAvailable(available)
      setSession(session)
    })
  }, [])

  const handleSend = async () => {
    if (input.trim()) {
      const userMessageId = Date.now()
      setMessages([...messages, { id: userMessageId, text: input, sender: 'user' }])
      setInput('')

      const { isLicensed, model } = await getSettings()

      if (!isLicensed) {
        toast.error(
          'Please enter a license key 🔑 to use Inline AI. Setup the license key by clicking the top left gear icon.',
          {
            duration: 5000,
            icon: '🔑',
          },
        )
        return
      }

      const aiMessageId = Date.now() + 1
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: aiMessageId,
          text: '', // leave text empty, it'll be replaced by `dangerouslySetInnerHTML`
          sender: 'ai',
          dangerouslySetInnerHTML: {
            __html: `
              <svg height="40" width="40" class="loader">
                <circle class="dot" cx="10" cy="20" r="3" style="fill:grey;" />
                <circle class="dot" cx="20" cy="20" r="3" style="fill:grey;" />
                <circle class="dot" cx="30" cy="20" r="3" style="fill:grey;" />
              </svg>`,
          },
        },
      ])

      setLoadingMessageId(aiMessageId)

      console.log(responseLength)

      if (model === 'gemini' && available === 'readily') {
        const stream = session.promptStreaming(
          responseTypePrompt +
            input +
            '. Your response length should strictly be ' +
            responseLength,
        )

        for await (const chunk of stream) {
          setLoadingMessageId(null)
          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              message.id === aiMessageId ? { ...message, text: chunk } : message,
            ),
          )
        }
      } else if (model === 'openai') {
        const { llm, apiKey } = await getSettings()

        const promptContent = `${input}. Your response length should strictly be ${responseLength}`
        const headers = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        }

        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              model: llm,
              messages: [
                { role: 'system', content: responseType },
                { role: 'user', content: promptContent },
              ],
              stream: true, // Enable streaming
            }),
          })

          const reader = response.body.getReader()
          const decoder = new TextDecoder()
          let done = false
          let fullText = '' // Will hold the ongoing AI response

          // Stream chunks as they are received
          while (!done) {
            const { value, done: doneReading } = await reader.read()
            done = doneReading
            const chunk = decoder.decode(value)

            // OpenAI stream sends data in lines starting with "data:"
            const lines = chunk.split('\n').filter((line) => line.trim() !== '')
            for (const line of lines) {
              const message = line.replace(/^data: /, '')

              if (message === '[DONE]') {
                setLoadingMessageId(null)
                return
              }

              try {
                const parsed = JSON.parse(message)
                const delta = parsed.choices[0].delta.content || ''

                // Append each delta (chunk) to the full text
                fullText += delta

                // Update the AI message incrementally
                setMessages((prevMessages) =>
                  prevMessages.map((msg) =>
                    msg.id === aiMessageId ? { ...msg, text: fullText } : msg,
                  ),
                )
              } catch (error) {
                console.error('Error parsing message:', error)
              }
            }
          }
        } catch (error) {
          console.error('Error during OpenAI streaming:', error)
          toast.error('There was an issue with the AI stream.')
          setLoadingMessageId(null)
        }
      }
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Message copied to clipboard')
        setCopiedMessageId(id)
        setTimeout(() => {
          setCopiedMessageId(null)
        }, 200)
      },
      (err) => {
        console.error('Could not copy text: ', err)
      },
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900">
      <header className="flex justify-between items-center bg-white border-b border-gray-200">
        <Button
          onClick={() => chrome.runtime.openOptionsPage()}
          className="text-gray-600 hover:bg-gray-100 border-none"
        >
          <FaGear className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold border-none">Inline AI Assistant</h1>
        <Button
          onClick={async () => {
            setMessages([{ id: 1, text: 'Hello! How can I assist you today?', sender: 'ai' }])
            await destroyGeminiSession() // Destroy the current session
            const { session, available } = await createGeminiSession() // Create a new session
            setSession(session) // Set the new session
            setAvailable(available) // Update availability status
          }}
          className="text-gray-600 hover:bg-gray-100"
        >
          <IoMdRefresh className="h-5 w-5" />
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start space-x-2 mb-4 ${
              message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'ai' ? 'bg-[#FFBE18] text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {message.sender === 'ai' ? (
                <FaWandMagicSparkles className="h-4 w-4" />
              ) : (
                <FaUser className="h-4 w-4" />
              )}
            </div>
            <div
              className={`flex-1 rounded-lg p-3 ${
                message.sender === 'user' ? 'bg-gray-100' : 'bg-white'
              }`}
            >
              {loadingMessageId === message.id && message.sender === 'ai' ? (
                <div dangerouslySetInnerHTML={message.dangerouslySetInnerHTML}></div>
              ) : (
                <ReactMarkdown className="prose prose-sm max-w-none">{message.text}</ReactMarkdown>
              )}
            </div>
            {message.sender === 'ai' && (
              <Button
                onClick={() => copyToClipboard(message.text, message.id)}
                className="self-start text-gray-500 hover:bg-gray-100"
              >
                {copiedMessageId === message.id ? (
                  <BsCheck2All className="h-4 w-4" />
                ) : (
                  <BsCopy className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        ))}
      </div>

      <footer className="border-t border-gray-200 bg-white p-4">
        <div className="flex space-x-2 mb-2">
          <Select
            // value={responseType}
            // onChange={setResponseType}
            // options={[
            //   { value: 'Reply', label: 'Reply' },
            //   { value: 'Translate', label: 'Translate' },
            //   { value: 'Summarize', label: 'Summarize' },
            // ]}

            value={responseType}
            onChange={(value) => {
              setResponseType(value)

              // setResponseTypePrompt to promptList.prompt by finding the prompt with the same name as the selected response type
              const selectedPrompt = promptList.find((prompt) => prompt.name === value)

              console.log(selectedPrompt)

              if (selectedPrompt) {
                setResponseTypePrompt(selectedPrompt.prompt)
              }
            }}
            options={promptList.map((prompt) => ({
              value: prompt.name,
              label: prompt.name,
            }))}
          />
          <Select
            value={responseLength}
            onChange={setResponseLength}
            options={[
              { value: 'Short', label: 'Short' },
              { value: 'Detailed', label: 'Detailed' },
            ]}
          />
        </div>
        <div className="flex space-x-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message here..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleSend}
            className="bg-[#FFBE18] text-white hover:bg-[#ffa81f]"
          >
            <IoMdSend className="h-5 w-5" />
          </Button>
        </div>
      </footer>
    </div>
  )
}
