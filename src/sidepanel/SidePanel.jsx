import React, { useState, useEffect } from 'react'
import { FaUser, FaWandMagicSparkles, FaGear } from 'react-icons/fa6'
import { BsCopy, BsCheck2All } from 'react-icons/bs'
import { IoMdSend, IoMdRefresh } from 'react-icons/io'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

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
    maxLength={3000}
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
  const [promptList, setPromptList] = useState([])
  const [responseTypePromptName, setResponseTypePromptName] = useState('')
  const [responseTypePrompt, setResponseTypePrompt] = useState('')
  const [responseLength, setResponseLength] = useState('Short')

  const getSettings = async () => {
    const { model, llm, promptList, apiKey } = await chrome.runtime.sendMessage({
      type: 'getSettings',
    })
    return { model, llm, promptList, apiKey }
  }

  // set promptList to the state
  useEffect(() => {
    getSettings().then(({ promptList }) => {
      // static prompt list
      const staticPromptList = [
        // {
        //   id: 1,
        //   name: 'Rewrite',
        //   prompt: '',
        // },
        // {
        //   id: 2,
        //   name: 'Write',
        //   prompt: '',
        // },
        {
          id: 3,
          name: 'Summarize',
          prompt: '',
        },
      ]
      const finalPromptList = [...staticPromptList, ...promptList]
      setPromptList(finalPromptList)
    })
  }, [])

  // set responseTypePrompt to promptList.prompt and responseTypePromptName to promptList.name of the first prompt in the promptList
  useEffect(() => {
    if (promptList.length > 0) {
      setResponseTypePromptName(promptList[0].name)
      setResponseTypePrompt(promptList[0].prompt)
    }
  }, [promptList])

  const createGeminiSession = async () => {
    const { available } = await ai?.languageModel?.capabilities()
    const session = await ai.languageModel.create({
      systemPrompt: responseTypePrompt,
    })
    return { session, available }
  }

  const createSummarizerSession = async () => {
    const { available } = await ai?.languageModel?.capabilities()
    const canSummarize = await ai.summarizer.capabilities()
    let summarizer
    if (canSummarize && canSummarize.available !== 'no') {
      if (canSummarize.available === 'readily') {
        // The summarizer can immediately be used.
        summarizer = await ai.summarizer.create()
      } else {
        // The summarizer can be used after the model download.
        summarizer = await ai.summarizer.create()
        summarizer.addEventListener('downloadprogress', (e) => {
          console.log(e.loaded, e.total)
        })
        await summarizer.ready
      }
    } else {
      // The summarizer can't be used at all.
      console.error('Summarizer is not available')
    }

    return { summarizer, available }
  }

  // might be used later when issues with writer and rewriter are resolved - https://issues.chromium.org/issues/374942272?pli=1
  // const createRewriterSession = async () => {
  //   await destroyGeminiSession()
  //   const { available } = await ai?.languageModel?.capabilities()
  //   const rewriter = await ai.rewriter.create()
  //   return { session, available }
  // }

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

    // check if session is available and create a new session if it's not
    if (session) {
      return
    }

    createGeminiSession().then(({ session, available }) => {
      setAvailable(available)
      setSession(session)
    })
  }, [responseTypePrompt])

  const handleSend = async () => {
    if (input.trim()) {
      const userMessageId = Date.now()
      const userMessage = { id: userMessageId, text: input, sender: 'user' }
      setMessages([...messages, userMessage])
      setInput('')

      const { model } = await getSettings()

      const aiMessageId = Date.now() + 1
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          id: aiMessageId,
          text: '', // leave text empty, it'll be replaced by `dangerouslySetInnerHTML`
          sender: 'ai',
          isLoadingMessage: true,
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

      // Map the conversation history for OpenAI's format
      const conversationHistory = messages.map((message) => ({
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: message.text,
      }))

      // Add the current user message to the conversation history
      conversationHistory.push({
        role: 'user',
        content: input,
      })

      if (model === 'gemini' && available === 'readily') {
        if (responseTypePromptName === 'Summarize') {
          const { summarizer, available } = await createSummarizerSession()
          if (available === 'readily') {
            const stream = await summarizer.summarize(
              input + '. Your response length should strictly be ' + responseLength,
            )
            setLoadingMessageId(null)
            setMessages((prevMessages) =>
              prevMessages.map((message) =>
                message.id === aiMessageId
                  ? {
                      ...message,
                      dangerouslySetInnerHTML: { __html: stream },
                      isLoadingMessage: false,
                    }
                  : message,
              ),
            )
          }
          return
        }

        const stream = session.promptStreaming(
          // responseTypePrompt +
          input + '. Your response length should strictly be ' + responseLength,
        )

        for await (const chunk of stream) {
          setLoadingMessageId(null)
          setMessages((prevMessages) =>
            prevMessages.map((message) =>
              message.id === aiMessageId
                ? {
                    ...message,
                    dangerouslySetInnerHTML: { __html: chunk },
                    isLoadingMessage: false,
                  }
                : message,
            ),
          )
        }
      }
    }
  }

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(
      () => {
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
              {message.sender === 'ai' && message.id === 1 ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                  {message.text}
                </ReactMarkdown>
              ) : message.sender === 'ai' ? (
                message.isLoadingMessage ? (
                  <div dangerouslySetInnerHTML={message.dangerouslySetInnerHTML} />
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {message.dangerouslySetInnerHTML.__html}
                  </ReactMarkdown>
                )
              ) : (
                <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose prose-sm max-w-none">
                  {message.text}
                </ReactMarkdown>
              )}
            </div>
            {message.sender === 'ai' && (
              <Button
                onClick={() => copyToClipboard(message.dangerouslySetInnerHTML.__html, message.id)}
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
            value={responseTypePromptName}
            onChange={(value) => {
              // setResponseTypePrompt to promptList.prompt by finding the prompt with the same name as the selected response type
              const selectedPrompt = promptList.find((prompt) => prompt.name === value)

              if (selectedPrompt) {
                setResponseTypePromptName(selectedPrompt.name)
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
