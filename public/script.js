document.addEventListener("DOMContentLoaded", () => {
  const chatForm = document.getElementById("chat-form");
  const promptInput = document.getElementById("prompt-input");
  const imageInput = document.getElementById("image-input");
  const attachFileBtn = document.getElementById("attach-file-btn");
  const chatMessages = document.getElementById("chat-messages");
  const imagePreviewContainer = document.getElementById(
    "image-preview-container"
  );
  const personalitySelect = document.getElementById("personality-select");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const sendBtn = document.getElementById("send-btn");
  const imagePreview = document.getElementById("image-preview");
  const removeImageBtn = document.getElementById("remove-image-btn");
  const clearChatBtn = document.getElementById("clear-chat-btn");

  let chatHistory = [];
  let attachedFile = null;

  const saveHistory = () => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  };

  const loadHistory = () => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      chatHistory = JSON.parse(savedHistory);
      chatMessages.innerHTML = ""; // Clear initial message
      chatHistory.forEach((message) => {
        const textPart = message.parts.find((part) => part.text)?.text || "";
        const imagePart = message.parts.find((part) => part.inlineData);
        let imageSrc = null;
        if (imagePart) {
          imageSrc = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
        }
        appendMessage(message.role, textPart, imageSrc);
      });
    }
  };

  const clearChat = () => {
    // Clear the history array
    chatHistory = [];
    // Clear the localStorage
    localStorage.removeItem("chatHistory");
    // Clear the UI
    chatMessages.innerHTML = `
      <div class="message model-message" style="animation: none;">
        <img src="bot-avatar.svg" alt="AI" class="avatar" />
        <div class="message-content">
          <p>Hello! How can I help you today?</p>
        </div>
      </div>
    `;
    promptInput.focus();
  };

  // --- Theme Logic ---
  const setTheme = (theme) => {
    // If the theme is 'light', add the class, otherwise remove it.
    document.body.classList.toggle("light-theme", theme === "light");
    themeToggleBtn.textContent = theme === "light" ? "☀️" : "🌙";
    localStorage.setItem("theme", theme);
  };

  const toggleTheme = () => {
    // Reads the current theme from localStorage (or defaults to 'dark') and inverts it.
    const currentTheme = localStorage.getItem("theme") || "dark";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    setTheme(newTheme);
  };

  // Adjust textarea height
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = `${promptInput.scrollHeight}px`;
  });

  // Send with Enter
  promptInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendBtn.click();
    }
  });

  // Theme toggle button
  themeToggleBtn.addEventListener("click", toggleTheme);

  // Clear chat button
  clearChatBtn.addEventListener("click", clearChat);

  // Attachment button
  attachFileBtn.addEventListener("click", () => imageInput.click());

  // Image preview
  imageInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      attachedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        imagePreview.src = e.target.result;
        imagePreviewContainer.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // Remove image
  removeImageBtn.addEventListener("click", () => {
    attachedFile = null;
    imageInput.value = ""; // Clear the file input
    imagePreviewContainer.style.display = "none";
  });

  // Form submission
  chatForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    if (!prompt && !attachedFile) return;

    // Add user message to the UI
    const imageForUI = attachedFile; // Keep the File object for the UI
    appendMessage("user", prompt, imageForUI);
    const personality = personalitySelect.value;

    const userMessageParts = [{ text: prompt }];

    const formData = new FormData();
    formData.append("prompt", prompt);
    formData.append("personality", personality);
    formData.append("history", JSON.stringify(chatHistory));
    if (attachedFile) {
      formData.append("image", attachedFile);
      userMessageParts.push({
        inlineData: {
          mimeType: attachedFile.type,
          data: await toBase64(attachedFile),
        },
      });
    }
    const userMessage = { role: "user", parts: userMessageParts };

    // Clear input and preview
    promptInput.value = "";
    promptInput.style.height = "auto";
    removeImageBtn.click();

    // Add a placeholder for the model's response
    const modelMessageElement = appendMessage("model", "", null, true);
    const modelContentElement =
      modelMessageElement.querySelector(".message-content");

    try {
      const response = await fetch("/api/gerar-texto", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || "API Error");
      }

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      modelContentElement.innerHTML = ""; // Remove loading indicator

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullResponse += chunk;
        modelContentElement.innerHTML = marked.parse(fullResponse);
        addCopyButtons(modelContentElement);
        hljs.highlightAll({ ignoreUnescapedHTML: true });
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }

      // Update history
      chatHistory.push(userMessage);
      chatHistory.push({ role: "model", parts: [{ text: fullResponse }] });
      saveHistory();
    } catch (error) {
      modelContentElement.innerHTML = `<p style="color: #ff5c5c;">Error: ${error.message}</p>`;
    } finally {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  function appendMessage(role, text, file, isLoading = false) {
    const messageWrapper = document.createElement("div");
    messageWrapper.className = `message ${role}-message`;

    const avatar = document.createElement("img");
    avatar.src = role === "user" ? "user-avatar.svg" : "bot-avatar.svg"; // Create a user-avatar.svg
    avatar.alt = role;
    avatar.className = "avatar";

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    if (isLoading) {
      contentDiv.innerHTML = `
        <div class="typing-indicator">
          <p>Typing</p>
          <div class="loading-dots"><span></span><span></span><span></span></div>
        </div>
      `;
    } else {
      if (text) contentDiv.innerHTML += marked.parse(text);
      if (file) {
        const img = document.createElement("img");
        if (typeof file === "string") {
          // It's a data URL from history
          img.src = file;
        } else {
          // It's a File object for new messages
          img.src = URL.createObjectURL(file);
        }
        img.style.maxWidth = "200px";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        contentDiv.appendChild(img);
      }
      // Add copy buttons for model messages
      if (role === "model") {
        addCopyButtons(contentDiv);
      }
    }

    messageWrapper.appendChild(avatar);
    messageWrapper.appendChild(contentDiv);
    chatMessages.appendChild(messageWrapper);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageWrapper;
  }

  function addCopyButtons(container) {
    container.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-btn")) return; // Don't add if it already exists

      const button = document.createElement("button");
      button.className = "copy-btn";
      button.textContent = "Copy";

      button.addEventListener("click", () => {
        const code = pre.querySelector("code");
        if (navigator.clipboard && code) {
          navigator.clipboard.writeText(code.textContent).then(() => {
            button.textContent = "Copied!";
            setTimeout(() => {
              button.textContent = "Copy";
            }, 2000);
          });
        }
      });

      pre.appendChild(button);
    });
  }

  // Helper function to convert file to base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  }

  // --- Initialization on page load ---
  loadHistory();
  // Load saved theme or set default
  setTheme(localStorage.getItem("theme") || "dark");
});
