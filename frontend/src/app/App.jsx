import './App.css'
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

const LANGUAGE_TEMPLATES = {
  java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java");
  }
}`,
  python: `print("Hello from Python")`,
  cpp: `#include <iostream>
using namespace std;

int main() {
  cout << "Hello from C++" << endl;
  return 0;
}`,
}

function App() {
  const editorRef = useRef(null)
  const [username, setUsername] = useState(() => {
    const path = window.location.pathname
    return path.substring(1) || ""
  })

  const [users, setUsers] = useState([])
  const [language, setLanguage] = useState("java")
  const [isRunning, setIsRunning] = useState(false)
  const [runResult, setRunResult] = useState("Run output will appear here.")

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])

  const handleMount = (editor) => {
    editorRef.current = editor
    new MonacoBinding(yText, editorRef.current.getModel(), new Set([editorRef.current]),)

  }

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model && model.getValue().trim().length === 0) {
        model.setValue(LANGUAGE_TEMPLATES[nextLanguage])
      }
    }
  }

  const handleRunCode = async () => {
    if (!editorRef.current) return
    setIsRunning(true)
    setRunResult("Running...")

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          code: editorRef.current.getValue(),
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        setRunResult(data.message || "Execution failed.")
        return
      }

      const output = [data.stdout, data.stderr].filter(Boolean).join("\n")
      setRunResult(output || "Program finished with no output.")
    } catch (error) {
      setRunResult(error instanceof Error ? error.message : "Request failed.")
    } finally {
      setIsRunning(false)
    }
  }


  const handleJoin = (e) => {
    e.preventDefault()
    setUsername(e.target.username.value)
    window.history.pushState({}, "", `/${e.target.username.value}`) // update url with username

  }

  useEffect(() => {
    if (username) {
      const provider = new SocketIOProvider("/", "monaco-demo-room", ydoc, { autoConnect: true })
      provider.awareness.setLocalStateField("user", { username, })

      const states = Array.from(provider.awareness.getStates().values())
      setUsers(states.filter(state => state && state.user && state.user.username).map(state => state.user))

      provider.awareness.on("change", () => {
        const states = Array.from(provider.awareness.getStates().values())
        setUsers(states.filter(state => state && state.user && state.user.username).map(state => state.user))
      })
      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null) // Clear user state on disconnect
      }
      window.addEventListener("beforeunload", handleBeforeUnload)

      return () => {
        provider.disconnect()
        window.removeEventListener("beforeunload", handleBeforeUnload)
      }


    }
  }, [username])

  if (!username) {
    {
      return (
        <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
          <form className='flex flex-col gap-4'
            onSubmit={handleJoin}>
            <input type="text" placeholder='Enter your username' className='p-2 rounded-lg bg-gray-800 text-white'
              name='username' />
            <button className='bg-amber-50 p-2 rounded-lg text-gray-950 font-bold'>Join</button>
          </form>
        </main>
      )
    }
  }
  return (
    <main className="h-screen w-full bg-gray-950 flex gap-4 p-4">
      <aside className='h-full w-1/4 bg-amber-50 rounded-lg'>
        <h2 className='text-gray-950 font-bold text-xl p-4 border-b'>Active Users</h2>
        <ul className='p-4 flex flex-col gap-2'>
          {users.map((user, index) => (
            <li key={index} className='bg-gray-800 text-white p-2 rounded-lg'>{user.username}</li>
          ))}
        </ul>
      </aside>
      <section className='w-3/4 bg-neutral-800 rounded-lg overflow-hidden flex flex-col'>
        <div className='flex items-center justify-between gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-700'>
          <div className='flex items-center gap-3'>
            <label className='text-white text-sm'>Language</label>
            <select
              className='bg-neutral-800 text-white rounded-md px-2 py-1 text-sm'
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>
          <button
            className='bg-amber-50 text-gray-900 px-4 py-1.5 rounded-md font-semibold disabled:opacity-60'
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? "Running..." : "Run"}
          </button>
        </div>
        <Editor
          height="70%"
          defaultLanguage={language}
          defaultValue={LANGUAGE_TEMPLATES[language]}
          theme="vs-dark"
          onMount={handleMount}
          language={language}
        />
        <div className='h-[30%] bg-neutral-900 border-t border-neutral-700 p-4 overflow-auto'>
          <h3 className='text-sm text-neutral-300 mb-2'>Output</h3>
          <pre className='text-sm text-green-300 whitespace-pre-wrap'>{runResult}</pre>
        </div>
      </section>
    </main>
  )

}


export default App
