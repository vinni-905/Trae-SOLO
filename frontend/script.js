// ----------------- Monaco Editor Setup -----------------
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' }});
require(["vs/editor/editor.main"], function () {
  window.editor = monaco.editor.create(document.getElementById("editor"), {
    value: "// Select a file from the sidebar to load its contents...",
    language: "javascript",
    theme: "vs-dark",
    fontSize: 14,
  });

  loadFileList();
});

// ----------------- Dummy File Contents -----------------
let files = {
  "main.py": "print('Hello from main.py!')",
  "index.html": "<!DOCTYPE html>\n<html>\n<head><title>Demo</title></head>\n<body>\n<h1>Hello World</h1>\n</body>\n</html>",
  "style.css": "body { background: #eee; font-family: Arial; }",
  "script.js": "console.log('Hello from script.js!');",
  "README.md": "# Trae SOLO IDE\nThis is a demo file explorer + editor."
};

let selectedFile = null;
let selectedFileLi = null;

// ----------------- File Explorer -----------------
function loadFileList() {
  const list = document.getElementById("file-list");
  list.innerHTML = "";
  Object.keys(files).forEach(filename => {
    const li = document.createElement("li");
    li.textContent = filename;
    li.classList.add("file-item");
    li.onclick = () => openFile(filename, li);
    list.appendChild(li);
  });
}

function openFile(filename, liElement) {
  const content = files[filename] || "";
  const ext = filename.split(".").pop();
  editor.setValue(content);

  let lang = "plaintext";
  if (ext === "py") lang = "python";
  else if (ext === "js") lang = "javascript";
  else if (ext === "html") lang = "html";
  else if (ext === "css") lang = "css";
  else if (ext === "md") lang = "markdown";

  monaco.editor.setModelLanguage(editor.getModel(), lang);

  if (selectedFileLi) selectedFileLi.classList.remove("selected");
  liElement.classList.add("selected");
  selectedFileLi = liElement;
  selectedFile = filename;
}

// ----------------- Ask AI Button -----------------
function askAI() {
  const msg = prompt("Enter your question for AI:");
  if (!msg) return;
  sendToBackend(msg);
}

// ----------------- Chat Functionality -----------------
async function sendMessage(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const input = document.getElementById("chat-input");
    const msg = input.value.trim();
    if (!msg) return;

    const chatBox = document.getElementById("chat-box");

    const userDiv = document.createElement("div");
    userDiv.className = "chat-message user";
    userDiv.textContent = msg;
    chatBox.appendChild(userDiv);

    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;

    const loadingDiv = document.createElement("div");
    loadingDiv.className = "chat-message ai";
    loadingDiv.textContent = "🤖 Thinking...";
    chatBox.appendChild(loadingDiv);

    await sendToBackend(msg, loadingDiv);
  }
}

async function sendToBackend(msg, loadingDiv = null) {
  const chatBox = document.getElementById("chat-box");
  try {
    const response = await fetch("http://127.0.0.1:5000/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: msg }),
    });

    const data = await response.json();

    if (loadingDiv) loadingDiv.remove();

    const aiDiv = document.createElement("div");
    aiDiv.className = "chat-message ai";
    aiDiv.textContent = data.answer || "🤖 No response from AI.";
    chatBox.appendChild(aiDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    if (loadingDiv) loadingDiv.remove();
    const aiDiv = document.createElement("div");
    aiDiv.className = "chat-message ai";
    aiDiv.textContent = "❌ Backend not reachable!";
    chatBox.appendChild(aiDiv);
  }
}

// ----------------- Generate Project -----------------
async function generateProject() {
  try {
    const response = await fetch("http://127.0.0.1:5000/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();
    if (!data.files) throw new Error("Invalid project format");

    files = data.files;
    loadFileList();

    // Auto-open index.html if present
    if (files["index.html"]) {
      const listItems = document.querySelectorAll("#file-list li");
      listItems.forEach(li => {
        if (li.textContent === "index.html") li.click();
      });
    }

  } catch (err) {
    alert("❌ Project generation failed!");
  }
}

// ----------------- Auto-complete -----------------
async function autoComplete() {
  if (!selectedFile) {
    alert("⚠️ Open a file first!");
    return;
  }

  const currentCode = editor.getValue();
  try {
    const response = await fetch("http://127.0.0.1:5000/autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: currentCode, file: selectedFile }),
    });

    const data = await response.json();

    if (data.completion) {
      editor.setValue(data.completion);
      files[selectedFile] = data.completion; // update stored content
    } else {
      alert("🤖 AI did not return a completion.");
    }
  } catch (err) {
    alert("❌ Auto-complete failed!");
  }
}
