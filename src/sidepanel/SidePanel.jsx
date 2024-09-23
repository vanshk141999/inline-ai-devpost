import { useState, useEffect } from 'react'
import { FaUser } from 'react-icons/fa'
import { BsCopy, BsCheck2All } from 'react-icons/bs'
import { IoMdSend } from 'react-icons/io'
import { FaWandMagicSparkles } from 'react-icons/fa6'
import { FaGear } from 'react-icons/fa6'
import { IoMdRefresh } from 'react-icons/io'

import toast from 'react-hot-toast'
import './SidePanel.css'

export const SidePanel = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: 'Hello! How can I assist you today?', sender: 'ai' },
  ])
  const [input, setInput] = useState('')
  const [isCopied, setIsCopied] = useState(false)

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { id: Date.now(), text: input, sender: 'user' }])
      setInput('')
      // Simulate AI response
      setTimeout(() => {
        setMessages((prevMessages) => [
          ...prevMessages,
          { id: Date.now(), text: 'This is a simulated AI response.', sender: 'ai' },
        ])
      }, 1000)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Message copied to clipboard')
        setIsCopied(true)
        setTimeout(() => {
          setIsCopied(false)
        }, 200)
      },
      (err) => {
        console.error('Could not copy text: ', err)
      },
    )
  }

  return (
    <main className="overflow-hidden">
      <div className="fixed top-0 left-0 right-0 p-2 bg-neutral">
        <div className="flex justify-between items-center">
          <FaGear
            className="cursor-pointer"
            onClick={() => {
              chrome.runtime.openOptionsPage()
            }}
          />
          <IoMdRefresh
            className="cursor-pointer"
            onClick={() => {
              setMessages([{ id: 1, text: 'Hello! How can I assist you today?', sender: 'ai' }])
            }}
          />
        </div>
      </div>
      <div className="flex flex-col justify-between overflow-scroll max-h-[90vh] mt-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-center gap-1 mb-4 ${
              message.sender === 'user' ? 'flex-row-reverse self-end w-fit' : ''
            }`}
          >
            <div className="avatar placeholder">
              <div className="bg-neutral text-neutral-content w-8 rounded-full">
                <span className="text-xs">
                  {message.sender === 'ai' ? <FaWandMagicSparkles /> : <FaUser />}
                </span>
              </div>
            </div>
            <div
              className={`flex-1 px-4 py-2 rounded-lg w-fit ${
                message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}
            >
              <p className="text-sm text-left">{message.text}</p>
            </div>
            <button onClick={() => copyToClipboard(message.text)} aria-label="Copy message">
              {isCopied ? <BsCheck2All /> : <BsCopy />}
            </button>
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 left-0 right-0 p-2 bg-neutral">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex flex-col w-full items-center space-x-2"
        >
          <div className="flex gap-2 m-2 ml-4 w-full">
            <select className="p-2 rounded-md">
              <option>Reply</option>
              <option>Translate</option>
              <option>Summary</option>
            </select>
            <select className="p-2 rounded-md">
              <option>Short</option>
              <option>Medium</option>
              <option>Large</option>
            </select>
          </div>
          <div className="flex flex-1 items-center gap-2 w-full">
            <input
              className="input w-full max-w-xs focus:border-none max-h-8"
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }

                if (e.key === 'Enter' && e.shiftKey) {
                  setInput((prevInput) => prevInput + '\n')
                }
              }}
            />
            <button type="submit">
              <IoMdSend />
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default SidePanel
