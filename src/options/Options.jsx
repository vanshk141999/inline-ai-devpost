import { useState, useEffect } from 'react'
import { PiMagicWand } from 'react-icons/pi'
import {
  MdOutlineSettings,
  MdOutlineKey,
  MdSwitchAccessShortcut,
  MdOutlineHelpOutline,
  MdEdit,
  MdDelete,
  MdAdd,
} from 'react-icons/md'

import logo from '../../public/img/logo.svg'
import toast from 'react-hot-toast'
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd'

import './Options.css'

export const Options = () => {
  const [id, setId] = useState()

  useEffect(() => {
    const url = new URL(window.location.href)

    if (id) {
      url.searchParams.set('id', id)
      window.history.pushState({}, '', url)
    } else {
      const id = url.searchParams.get('id')
      setId(id || 'managePrompts')
    }
  }, [id])

  return (
    <>
      <main className="text-[#181A2A]">
        {/* Sidebar */}
        <ul className="menu rounded-box w-56 gap-4 shadow-md bg-[#F3F3F3]">
          <h1 className="flex flex-row items-center justify-center gap-2 p-4">
            <img src={logo} alt="Inline AI" className="w-[28px] h-[28px] p-0 m-0" />
            <span className="text-xl font-bold">Inline AI</span>
          </h1>
          <div className="flex flex-col gap-3 text-[.9rem]">
            <li>
              <p
                onClick={() => setId('howTo')}
                className={`cursor-pointer active:!bg-transparent ${id === 'howTo' ? 'hover:!bg-[#FFBE18] bg-[#FFBE18] text-white' : ''}`}
              >
                <MdOutlineHelpOutline />
                How To Use
              </p>
            </li>
            <li>
              <p
                onClick={() => setId('managePrompts')}
                className={`cursor-pointer active:!bg-transparent  ${id === 'managePrompts' ? 'hover:!bg-[#FFBE18] bg-[#FFBE18] text-white' : ''}`}
              >
                <MdOutlineSettings />
                Manage Prompts
              </p>
            </li>
            <li>
              <p
                onClick={() => setId('shortcuts')}
                className={`cursor-pointer active:!bg-transparent  ${id === 'shortcuts' ? 'hover:!bg-[#FFBE18] bg-[#FFBE18] text-white' : ''}`}
              >
                <MdSwitchAccessShortcut />
                Shortcuts
              </p>
            </li>
            <li>
              <p
                onClick={() => setId('aiSettings')}
                className={`cursor-pointer active:!bg-transparent ${id === 'aiSettings' ? 'hover:!bg-[#FFBE18] bg-[#FFBE18] text-white' : ''}`}
              >
                <PiMagicWand />
                AI Settings
              </p>
            </li>
            <li>
              <p
                onClick={() => {
                  setId('manageLicense')
                }}
                className={`cursor-pointer active:!bg-transparent  ${id === 'manageLicense' ? 'hover:!bg-[#FFBE18] bg-[#FFBE18] text-white' : ''}`}
              >
                <MdOutlineKey />
                Manage License
              </p>
            </li>
          </div>
        </ul>
        <div className="p-4 w-full overflow-y-auto">
          {id === 'howTo' && <HowToUse />}
          {id === 'managePrompts' && <ManagePrompts />}
          {id === 'shortcuts' && <Shortcuts />}
          {id === 'aiSettings' && <AISettings />}
          {id === 'manageLicense' && <ManageLicense />}
          <div class="bso-container"></div>
        </div>
      </main>
    </>
  )
}

const HowToUse = () => {
  return (
    <>
      <div className="text-xl font-bold text-gray-900 mb-6">How To Use</div>
      <div className="w-full max-w-[31rem] m-auto text-left">
        <div className="text-lg font-semibold text-gray-900 mb-4">Step 1: Select Text</div>
        <p className="text-gray-500">
          Select and Right-click on the text you want to process. Select{' '}
          <b>Process with Inline AI</b> menu.
        </p>
        <div className="text-lg font-semibold text-gray-900 mt-6 mb-4">Step 2: Choose Prompt</div>
        <p className="text-gray-500">
          You can choose any prompt that you want to use to process the selected text. You can also
          choose the response length from small, medium, and large.
        </p>
      </div>
    </>
  )
}

const ManagePrompts = () => {
  const [promptList, setPromptList] = useState([
    {
      id: 1,
      name: 'Reply',
      prompt:
        'Craft a thoughtful response to the given chat message, social media post, comment, or email, ensuring it matches the tone and sentiment of the original message.',
    },
    {
      id: 2,
      name: 'Summarize',
      prompt:
        'Generate a brief and clear summary of the provided text, focusing on the main points and conveying the key message in a concise manner.',
    },
    {
      id: 3,
      name: 'Translate',
      prompt:
        'Translate the provided text into English while maintaining the original meaning and tone.',
    },
    {
      id: 7,
      name: 'Reword',
      prompt:
        'Generate a clearer, simpler, and more concise version of the given text that is easy to read and understand.',
    },
    {
      id: 6,
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
      id: 4,
      name: 'Inspire',
      prompt:
        'Generate creative ideas or inspiration based on the provided text to help spark new thoughts or approaches.',
    },
  ])

  // Retrieve prompts from Chrome storage
  useEffect(() => {
    chrome.storage.sync.get(['iai_prompt_list'], (result) => {
      if (result.iai_prompt_list) {
        setPromptList(result.iai_prompt_list)
      }
    })
  }, [])

  // function to check if prompt already exists
  const promptExists = (promptName) => {
    return promptList.some((item) => item.name === promptName)
  }

  // Save in Chrome storage
  const savePrompts = (newPromptList) => {
    chrome.storage.sync.set({ iai_prompt_list: newPromptList }, () => {
      toast.success('Prompts saved!')
    })
  }

  const prepareModal = (id) => () => {
    const promptEditorModal = document.getElementById('promptUpdateModal')
    promptEditorModal.showModal()
    const prompt = promptList.find((item) => item.id === id)
    promptEditorModal.querySelector('#promptNameEditor').value = prompt.name
    promptEditorModal.querySelector('#promptEditor').value = prompt.prompt
  }

  const updatePrompt = (e) => {
    e.preventDefault()
    const promptEditorModal = document.getElementById('promptUpdateModal')
    const promptName = promptEditorModal.querySelector('#promptNameEditor').value
    const promptText = promptEditorModal.querySelector('#promptEditor').value

    const updatedPromptList = promptList.map((item) => {
      if (item.id === promptList[0].id) {
        return { ...item, name: promptName, prompt: promptText }
      }
      return item
    })

    if (!promptName || !promptText) {
      toast.error('Please enter a prompt name and prompt text!')
      return
    }

    // check if prompt already exists
    // if (promptExists(promptName)) {
    //   toast.error('Prompt already exists!')
    //   return
    // }

    setPromptList(updatedPromptList)
    savePrompts(updatedPromptList)
    promptEditorModal.close()
  }

  const addPrompt = (e) => {
    e.preventDefault()
    const promptEditorModal = document.getElementById('promptAddModal')
    const promptName = promptEditorModal.querySelector('#promptNameEditor').value
    const promptText = promptEditorModal.querySelector('#promptEditor').value

    const newPromptList = [
      ...promptList,
      {
        id: promptList.length + 1,
        name: promptName,
        prompt: promptText,
      },
    ]

    if (!promptName || !promptText) {
      toast.error('Please enter a prompt name and prompt text!')
      return
    }

    // check if prompt already exists
    if (promptExists(promptName)) {
      toast.error('Prompt already exists!')
      return
    }

    setPromptList(newPromptList)
    savePrompts(newPromptList)
    promptEditorModal.close()
  }

  return (
    <>
      <div className="text-xl font-bold text-gray-900 mb-6 flex justify-center items-center gap-2">
        Manage Prompts{' '}
        <button
          onClick={() => {
            const promptAddModal = document.getElementById('promptAddModal')
            promptAddModal.showModal()

            promptAddModal.querySelector('#promptNameEditor').value = ''
            promptAddModal.querySelector('#promptEditor').value = ''
          }}
        >
          <MdAdd color="#FFBE18" size={36} />
        </button>
      </div>
      <div className="w-full max-w-[31rem] m-auto">
        <dialog id="promptUpdateModal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <form
              className="flex flex-col gap-4 items-center justify-center w-full"
              onSubmit={(e) => updatePrompt(e)}
            >
              <h1 className="text-xl font-bold text-gray-900 mb-2">Edit Prompt</h1>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Prompt Name</span>
                </div>
                <input
                  id="promptNameEditor"
                  type="text"
                  placeholder="Type here"
                  className="input input-bordered w-full"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Prompt</span>
                </div>
                <textarea
                  id="promptEditor"
                  className="textarea textarea-bordered w-full"
                  placeholder="Bio"
                ></textarea>
              </label>
              <button
                type="submit"
                className="btn mt-4 bg-[#FFBE18] hover:bg-[#E8A701] text-white border-none"
              >
                Update Prompt
              </button>
            </form>
          </div>
        </dialog>

        <dialog id="promptAddModal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
            </form>
            <form
              className="flex flex-col gap-4 items-center justify-center w-full"
              onSubmit={(e) => addPrompt(e)}
            >
              <h1 className="text-xl font-bold text-gray-900 mb-2">Add Prompt</h1>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Prompt Name</span>
                </div>
                <input
                  id="promptNameEditor"
                  type="text"
                  placeholder="Type here"
                  className="input input-bordered w-full"
                />
              </label>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">Prompt</span>
                </div>
                <textarea
                  id="promptEditor"
                  className="textarea textarea-bordered w-full"
                  placeholder="Bio"
                ></textarea>
              </label>
              <button
                type="submit"
                className="btn mt-4 bg-[#FFBE18] hover:bg-[#E8A701] text-white border-none"
              >
                Add Prompt
              </button>
            </form>
          </div>
        </dialog>

        <table className="table w-[600px] overflow-scroll mt-2">
          {/* head */}
          <thead>
            <tr>
              <th>Name</th>
              <th>Prompt</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <DragDropContext
            onDragEnd={(result) => {
              if (!result.destination) return

              // Reorder items
              const items = Array.from(promptList)
              const [reorderedItem] = items.splice(result.source.index, 1)
              items.splice(result.destination.index, 0, reorderedItem)

              setPromptList(items)
              savePrompts(items) // Save the reordered list
            }}
          >
            {/* body */}
            <Droppable droppableId="list">
              {(provided) => (
                <tbody {...provided.droppableProps} ref={provided.innerRef}>
                  {promptList.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                      {(provided, snapshot) =>
                        snapshot.isDragging ? (
                          <span
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              background: '#F0F0F0',
                              width: 'fit-content',
                              fontSize: '1rem',
                              padding: '1rem',
                              height: '50px',
                            }}
                          >
                            {item.name}
                          </span>
                        ) : (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={{
                              ...provided.draggableProps.style,
                              background: snapshot.isDragging ? '#e0f7fa' : 'inherit',
                              width: snapshot.isDragging ? `10%` : 'inherit',
                              fontSize: snapshot.isDragging ? '1rem' : '',
                              padding: snapshot.isDragging ? '1rem' : '',
                            }}
                            className={`${snapshot.isDragging ? '!w-full' : '!w-full'}`}
                          >
                            <td>{item.name}</td>
                            <td>{item.prompt}</td>
                            <td>
                              <button onClick={prepareModal(item.id)}>
                                <MdEdit color="#FFBE18" size={24} />
                              </button>
                            </td>
                            <td>
                              <button
                                onClick={() => {
                                  if (
                                    !window.confirm('Are you sure you want to delete this prompt?')
                                  ) {
                                    return
                                  }

                                  const filteredList = promptList.filter((i) => i.id !== item.id)
                                  setPromptList(filteredList)
                                  savePrompts(filteredList)
                                }}
                              >
                                <MdDelete className="text-red-500" size={24} />
                              </button>
                            </td>
                          </tr>
                        )
                      }
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </DragDropContext>
        </table>
      </div>
    </>
  )
}

const Shortcuts = () => {
  const [shortcuts, setShortcuts] = useState([])
  // get all shortcuts for this extension from background.js getAllShortcuts
  useEffect(() => {
    chrome.commands.getAll((commands) => {
      setShortcuts(commands)
    })
  }, [])

  console.log(shortcuts)

  return (
    <>
      <div className="text-xl font-bold text-gray-900 mb-6">Shortcuts</div>
      <div className="w-full max-w-[31rem] m-auto">
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-4 items-start">
            {shortcuts?.map((shortcut, index) => (
              <div className="flex flex-row gap-2 items-center" key={index}>
                <div className="flex flex-row gap-2">
                  {shortcut.shortcut.split('').map((key) => (
                    <kbd className="kbd text-lg">{key ?? 'No shortcut set'}</kbd>
                  ))}
                </div>
                {index === 0 ? (
                  <span className="label-text text-base ml-12">Open Inline AI chat side panel</span>
                ) : (
                  <span className="label-text text-base ml-12">
                    {shortcut.description ?? 'No Description set'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-4">
          <span className="font-semibold">Note:</span> You can change the shortcuts from{' '}
          <a
            onClick={() => {
              chrome.tabs.create({ url: 'chrome://extensions/shortcuts' })
            }}
            target="_blank"
            className="text-blue-500 cursor-pointer"
          >
            here
          </a>
          .
        </div>
      </div>
    </>
  )
}

const AISettings = () => {
  const [model, setModel] = useState('openai')
  const [llm, setLlm] = useState('gpt-4o')
  const [apiKey, setApiKey] = useState('')
  const [isGeminiAvailable, setIsGeminiAvailable] = useState('')

  // Load stored settings on mount
  useEffect(() => {
    chrome.storage.sync.get(['iai_model', 'iai_llm', 'iai_api_key'], (result) => {
      setModel(result.iai_model || 'openai')
      setLlm(result.iai_llm || 'gpt-4o')
      setApiKey(result.iai_api_key || '')
    })
  }, [])

  // Save settings to chrome storage
  const saveSettings = async (e) => {
    e.preventDefault()

    if (!apiKey && model === 'openai') {
      toast.error('Please enter an API key')
      return
    }

    chrome.storage.sync.set({ iai_model: model, iai_llm: llm, iai_api_key: apiKey }, () =>
      toast.success('Settings saved'),
    )
  }

  // check if window.

  const checkIfAiAvailable = async () => {
    if (!window.ai) {
      return 'not-available'
    }

    const { available } = await ai?.languageModel?.capabilities()

    return available
  }

  useEffect(() => {
    checkIfAiAvailable().then((available) => {
      setIsGeminiAvailable(available)
    })
  }, [])

  console.log(model)

  return (
    <>
      <div className="text-xl font-bold text-gray-900 mb-6">AI Settings</div>

      <div className="form-control w-full max-w-[31rem] m-auto">
        {isGeminiAvailable !== 'readily' && (
          <div className="text-sm text-gray-500 mb-4 text-left bg-[#fef08a] p-3 rounded-sm">
            <span className="font-semibold">Note:</span> Gemini Nano is currently not available in
            your browser. Please use OpenAI or follow the instructions below to enable free Gemini
            Nano AI Model.
            <ol>
              <li>
                - Download and install Chrome with built-in AI from{' '}
                <a href="https://www.google.com/intl/en_in/chrome/canary/" target="_blank">
                  here
                </a>
                .
              </li>
              <li>
                - Go to chrome://flags/#prompt-api-for-gemini-nano and enable the Prompt API for
                Gemini Nano option.
              </li>
              <li>
                - Go to chrome://flags/#optimization-guide-on-device-model and turn on the Enables
                optimization guide on device option.
              </li>
              <li>
                - Go to chrome://components/ and check or download the latest version of
                Optimization Guide On Device Model.
              </li>
            </ol>
          </div>
        )}
        <label className="form-control w-full">
          <div className="label">
            <span className="label-text">Select the AI Model to use</span>
          </div>
          <select
            className="select select-bordered"
            value={model}
            onChange={(e) => {
              const selectedModel = e.target.value
              setModel(selectedModel)
              if (selectedModel === 'gemini') {
                setLlm('gemini-nano')
              }
            }}
          >
            {isGeminiAvailable === 'readily' && <option value="gemini">Gemini Nano (Free)</option>}
            <option value="openai">Open AI (Paid)</option>
            {
              // will integrate Claude later
            }
            {/* <option value="claude">Claude (Paid)</option> */}
          </select>
        </label>

        {model === 'gemini' && <GeminiSettings />}
        {model === 'openai' && (
          <OpenAISettings llm={llm} setLlm={setLlm} apiKey={apiKey} setApiKey={setApiKey} />
        )}
        {model === 'claude' && (
          <ClaudeSettings llm={llm} setLlm={setLlm} apiKey={apiKey} setApiKey={setApiKey} />
        )}

        <button
          className="btn mt-4 bg-[#FFBE18] hover:bg-[#E8A701] text-white border-none"
          onClick={saveSettings}
        >
          Save
        </button>
      </div>
    </>
  )
}

const GeminiSettings = () => {
  return null // No extra settings for Gemini
}

const OpenAISettings = ({ llm, setLlm, apiKey, setApiKey }) => (
  <>
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text">Select the OpenAI Model to use</span>
      </div>
      <select
        className="select select-bordered"
        value={llm}
        onChange={(e) => setLlm(e.target.value)}
      >
        <option value="gpt-4o">GPT 4o</option>
        <option value="gpt-4o-mini">GPT 4o Mini</option>
        <option value="gpt-4-turbo">GPT 4 Turbo</option>
        <option value="gpt-4">GPT 4</option>
        <option value="gpt-3.5-turbo">GPT 3.5 Turbo</option>
      </select>
    </label>

    <label className="form-control w-full">
      <div className="label">
        <span className="label-text">OpenAI API Key</span>
      </div>
      <input
        type="text"
        value={apiKey}
        className="input input-bordered w-full"
        onChange={(e) => setApiKey(e.target.value)}
      />
    </label>
  </>
)

// will integrate Claude later
// const ClaudeSettings = ({ llm, setLlm, apiKey, setApiKey }) => (
//   <>
//     <label className="form-control w-full">
//       <div className="label">
//         <span className="label-text">Select the Claude Model to use</span>
//       </div>
//       <select
//         className="select select-bordered"
//         value={llm}
//         onChange={(e) => setLlm(e.target.value)}
//       >
//         <option value="claude-3-opus">Claude 3 Opus</option>
//         <option value="claude-3-5-sonnet-20240620">Claude 3.5 Sonnet</option>
//         <option value="claude-3-haiku">Claude 3 Haiku</option>
//       </select>
//     </label>

//     <label className="form-control w-full">
//       <div className="label">
//         <span className="label-text">Claude API Key</span>
//       </div>
//       <input
//         type="text"
//         value={apiKey}
//         className="input input-bordered w-full"
//         onChange={(e) => setApiKey(e.target.value)}
//       />
//     </label>
//   </>
// )

const ManageLicense = () => {
  const [licenseKey, setLicenseKey] = useState('')
  const [error, setError] = useState('')
  const [instanceId, setInstanceId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    chrome.storage.sync.get(['iai_license_key', 'iai_instance_id'], (result) => {
      setLicenseKey(result.iai_license_key || '')
      setInstanceId(result.iai_instance_id || '')
    })
  }, [])

  // activate license using lemonsqueezy
  const isLicenseActivated = async () => {
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/activate', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        license_key: licenseKey,
        instance_name: 'Test',
      }),
    })
    return await response.json()
  }

  const updateLicenseKey = async (e) => {
    e.preventDefault()

    if (!licenseKey) {
      setError('Please enter a license key')
      return
    }

    setIsLoading(true)
    const licenseData = await isLicenseActivated()

    if (licenseData.activated) {
      chrome.storage.sync.set(
        { iai_license_key: licenseKey, iai_instance_id: licenseData.instance.id },
        () => {
          setLicenseKey(licenseKey)
          setInstanceId(licenseData.instance.id)
          setError('')
        },
      )
    } else {
      setError('License not activated')
    }
    setIsLoading(false)
  }

  const deactivateLicense = async () => {
    const response = await fetch('https://api.lemonsqueezy.com/v1/licenses/deactivate', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        license_key: licenseKey,
        instance_id: instanceId,
      }),
    })
    const data = await response.json()
    return data
  }

  const deleteLicenseKey = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const deactivate = await deactivateLicense()
    if (deactivate.deactivated) {
      chrome.storage.sync.remove(['iai_license_key', 'iai_instance_id'], () => {
        setLicenseKey('')
        setInstanceId('')
      })
    }
    setIsLoading(false)
  }

  return (
    <>
      <div className="text-xl font-bold text-gray-900 mb-6">Manage License</div>
      <div className="form-control w-full max-w-[31rem] m-auto">
        <div className="label">
          <span className="label-text">
            License Key {'('}
            <a
              href="https://aiappstudio.lemonsqueezy.com/buy/a1bf37da-9948-468d-bbce-f0e94aff6641?checkout[discount_code]=EARLYBIRD20"
              target="_blank"
              className="text-blue-500"
            >
              Buy One
            </a>
            {')'}
          </span>
        </div>
        <div className="flex flex-row gap-4">
          <div className="w-full">
            <input
              required
              autoComplete="off"
              id="iai-license-key"
              type="text"
              className="input input-bordered w-full mb-4"
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              disabled={isLoading || instanceId}
            />
            {error && <div className="text-red-500 w-full">{error}</div>}
          </div>
          {instanceId ? (
            <button className="btn btn-error text-white" onClick={deleteLicenseKey}>
              Deactivate
              {isLoading && <span className="loading loading-spinner"></span>}
            </button>
          ) : (
            <button
              className="btn bg-[#FFBE18] hover:bg-[#E8A701] text-white border-none"
              onClick={updateLicenseKey}
            >
              Activate
              {isLoading && <span className="loading loading-spinner"></span>}
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default Options
