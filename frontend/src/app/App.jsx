import './App.css'
import { Editor } from "@monaco-editor/react"
import { MonacoBinding } from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react'
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"
import { io } from "socket.io-client"

const socket = io("/")

const THEME_STORAGE_KEY = "coedit-theme"

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

function getInitialTheme() {
  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

  if (savedTheme === "light" || savedTheme === "dark") {
    return savedTheme
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark"
}

function ThemeToggle({ theme, onToggle }) {
  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === "dark"}
      title={`Switch to ${nextTheme} theme`}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <span className="theme-toggle__knob" />
      </span>
      <span className="theme-toggle__text">
        {theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  )
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
  const [theme, setTheme] = useState(getInitialTheme)

  const ydoc = useMemo(() => new Y.Doc(), [])
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])
  const appClassName = `app-shell theme-${theme}`
  const editorTheme = theme === "dark" ? "vs-dark" : "vs"

  const handleThemeToggle = () => {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    )
  }

  const handleMount = (editor) => {
    editorRef.current = editor

    new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
    )
  }

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)

    socket.emit("language-change", nextLanguage)

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
        headers: {
          "Content-Type": "application/json"
        },
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

      const output = [data.stdout, data.stderr]
        .filter(Boolean)
        .join("\n")

      setRunResult(output || "Program finished with no output.")

    } catch (error) {

      setRunResult(
        error instanceof Error
          ? error.message
          : "Request failed."
      )

    } finally {
      setIsRunning(false)
    }
  }

  const handleJoin = (e) => {
    e.preventDefault()

    setUsername(e.target.username.value)

    window.history.pushState(
      {},
      "",
      `/${e.target.username.value}`
    )
  }

  useEffect(() => {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {

    socket.on("language-change", (lang) => {
      setLanguage(lang)
    })

    return () => {
      socket.off("language-change")
    }

  }, [])

  useEffect(() => {

    if (username) {

      const provider = new SocketIOProvider(
        "/",
        "monaco-demo-room",
        ydoc,
        { autoConnect: true }
      )

      provider.awareness.setLocalStateField("user", {
        username,
      })

      const states = Array.from(
        provider.awareness.getStates().values()
      )

      setUsers(
        states
          .filter(
            state =>
              state &&
              state.user &&
              state.user.username
          )
          .map(state => state.user)
      )

      provider.awareness.on("change", () => {

        const states = Array.from(
          provider.awareness.getStates().values()
        )

        setUsers(
          states
            .filter(
              state =>
                state &&
                state.user &&
                state.user.username
            )
            .map(state => state.user)
        )
      })

      function handleBeforeUnload() {
        provider.awareness.setLocalStateField("user", null)
      }

      window.addEventListener(
        "beforeunload",
        handleBeforeUnload
      )

      return () => {
        provider.disconnect()

        window.removeEventListener(
          "beforeunload",
          handleBeforeUnload
        )
      }
    }

  }, [username, ydoc])

  if (!username) {

    return (
      <main className={`${appClassName} join-layout`}>
        <div className="theme-floating">
          <ThemeToggle
            theme={theme}
            onToggle={handleThemeToggle}
          />
        </div>

        <form
          className='join-form'
          onSubmit={handleJoin}
        >

          <input
            type="text"
            placeholder='Enter your username'
            className='join-input'
            name='username'
          />

          <button className='join-button'>
            Join
          </button>

        </form>
      </main>
    )
  }

  return (
    <main className={`${appClassName} workspace-layout`}>

      <aside className='users-panel'>
        <h2 className='users-title'>
          Active Users
        </h2>

        <ul className='users-list'>
          {users.map((user, index) => (
            <li
              key={index}
              className='user-pill'
            >
              {user.username}
            </li>
          ))}
        </ul>
      </aside>

      <section className='editor-panel'>

        <div className='editor-toolbar'>

          <div className='language-control'>

            <label className='control-label'>
              Language
            </label>

            <select
              className='language-select'
              value={language}
              onChange={(e) =>
                handleLanguageChange(e.target.value)
              }
            >
              <option value="java">Java</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>

          </div>

          <div className="toolbar-actions">
            <ThemeToggle
              theme={theme}
              onToggle={handleThemeToggle}
            />

            <button
              className='run-button'
              onClick={handleRunCode}
              disabled={isRunning}
            >
              {isRunning ? "Running..." : "Run"}
            </button>
          </div>

        </div>

        <div className="editor-area">
          <Editor
            height="100%"
            defaultLanguage={language}
            defaultValue={LANGUAGE_TEMPLATES[language]}
            theme={editorTheme}
            onMount={handleMount}
            language={language}
          />
        </div>

        <div className='output-panel'>

          <h3 className='output-title'>
            Output
          </h3>

          <pre className='output-result'>
            {runResult}
          </pre>

        </div>

      </section>

    </main>
  )
}

export default App
