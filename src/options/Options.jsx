import { useState, useEffect } from 'react'
import {
  MdOutlineSettings,
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

const Options = () => {
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
                Manage System Prompts
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
          </div>
        </ul>
        <div className="p-4 w-full overflow-y-auto">
          {id === 'howTo' && <HowToUse />}
          {id === 'managePrompts' && <ManagePrompts />}
          {id === 'shortcuts' && <Shortcuts />}
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
          Select and Right-click on the text you want to process. Select <b>Run with Inline AI</b>{' '}
          menu.
        </p>
        <div className="text-lg font-semibold text-gray-900 mt-6 mb-4">
          Step 2: Choose a System Prompt
        </div>
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
      id: 4,
      name: 'Reply',
      prompt:
        'Craft a thoughtful response to the given chat message, social media post, comment, or email, ensuring it matches the tone and sentiment of the original message.',
    },
    {
      id: 5,
      name: 'Translate',
      prompt:
        'Translate the provided text into English while maintaining the original meaning and tone.',
    },
    {
      id: 6,
      name: 'CopyWrite',
      prompt:
        'Create compelling and persuasive marketing copy based on the given product description. The result should engage and inform the target audience, highlighting key features and benefits.',
    },
    {
      id: 7,
      name: 'Explain',
      prompt:
        'Provide detailed insights and explanations for the given keywords, data, or topic, offering valuable information and clarifying complex points.',
    },
    {
      id: 8,
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
      toast.error('System prompt already exists!')
      return
    }

    setPromptList(newPromptList)
    savePrompts(newPromptList)
    promptEditorModal.close()
  }

  return (
    <>
      <div className="text-xl font-bold text-gray-900 mb-6 flex justify-center items-center gap-2">
        Manage System Prompts{' '}
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
              <h1 className="text-xl font-bold text-gray-900 mb-2">Edit System Prompt</h1>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">System Prompt Name</span>
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
                  <span className="label-text">System Prompt</span>
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
                Update System Prompt
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
              <h1 className="text-xl font-bold text-gray-900 mb-2">Add System Prompt</h1>
              <label className="form-control w-full">
                <div className="label">
                  <span className="label-text">System Prompt Name</span>
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
                  <span className="label-text">System Prompt</span>
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
                Add System Prompt
              </button>
            </form>
          </div>
        </dialog>

        <table className="table w-[600px] overflow-scroll mt-2">
          {/* head */}
          <thead>
            <tr>
              <th>Name</th>
              <th>System Prompt</th>
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

export default Options
