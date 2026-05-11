import { GoogleGenAI } from "@google/genai";

const messageInput = document.querySelector(".message-input");
const chatBody = document.querySelector(".chat-body");
const sendMessageButton = document.querySelector("#send-message");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const fileCancelButton = document.querySelector("#file-cancel");
const chatbotToggler = document.querySelector("#chatbot-toggler");
const closeChatbot = document.querySelector("#close-chatbot");
const imagePreview = document.querySelector("#image-preview");
const emojiPickerBtn = document.querySelector("#emoji-picker-btn");

const emojis = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩", "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😬", "🙄", "😯", "😦", "😧", "😮", "😲", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "🤡", "💩", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃", "😺", "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾",
  "👋", "🤚", "🖐", "✋", "🖖", "👌", "🤏", "✌️", "🤞", "🤟", "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂", "🦻", "👃", "🧠", "🦷", "🦴", "👀", "👁", "👅", "👄",
  "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "💟"
];

const emojiPopup = document.createElement("div");
emojiPopup.classList.add("emoji-picker-popup");
emojis.forEach(emoji => {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("emoji-btn");
  btn.innerText = emoji;
  btn.addEventListener("click", () => {
    messageInput.value += emoji;
    messageInput.focus();
    emojiPopup.classList.remove("show");
  });
  emojiPopup.appendChild(btn);
});
fileUploadWrapper.parentElement.appendChild(emojiPopup);

let hoverTimeout;

emojiPickerBtn.addEventListener("mouseenter", () => {
  clearTimeout(hoverTimeout);
  emojiPopup.classList.add("show");
});

emojiPickerBtn.addEventListener("mouseleave", () => {
  hoverTimeout = setTimeout(() => {
    if (!emojiPopup.matches(':hover')) {
      emojiPopup.classList.remove("show");
    }
  }, 300);
});

emojiPopup.addEventListener("mouseenter", () => {
  clearTimeout(hoverTimeout);
});

emojiPopup.addEventListener("mouseleave", () => {
  hoverTimeout = setTimeout(() => {
    if (!emojiPickerBtn.matches(':hover')) {
        emojiPopup.classList.remove("show");
    }
  }, 300);
});

emojiPickerBtn.addEventListener("click", (e) => {
    e.preventDefault();
    emojiPopup.classList.toggle("show");
});

document.addEventListener("click", (e) => {
  if (!emojiPickerBtn.contains(e.target) && !emojiPopup.contains(e.target)) {
    emojiPopup.classList.remove("show");
  }
});

// Initialize Gemini directly in the frontend
// You can paste your API key directly here for testing
const HARDCODED_API_KEY = "AIza*****************"; 

const apiKey = HARDCODED_API_KEY || (process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY" ? "" : process.env.GEMINI_API_KEY);

// Sanitize key (remove trailing dots or spaces often accidentally pasted)
const cleanApiKey = apiKey ? apiKey.trim().replace(/\.$/, "") : "";

if (!cleanApiKey) {
  console.warn("Gemini API Key is not set. Please paste your key in chat.js or set it in Secrets.");
}

const ai = new GoogleGenAI({ apiKey: cleanApiKey });

const userData = {
  message: null,
  file: {
    data: null,
    mime_type: null,
  },
};

const chatHistory = [];

const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Simple Markdown-style formatter
const formatText = (text) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
};

const generateBotResponse = async (incomingMessageDiv) => {
  const messageElement = incomingMessageDiv.querySelector(".message-text");

  try {
    if (!cleanApiKey) {
        throw new Error("Gemini API Key is missing. Please paste your key in chat.js at the top or set it in Secrets.");
    }

    const parts = [
      { text: userData.message || "Analyze this image" }
    ];

    if (userData.file.data) {
      parts.push({
        inlineData: {
          mimeType: userData.file.mime_type,
          data: userData.file.data
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        ...chatHistory,
        { role: "user", parts }
      ],
    });

    const apiResponseText = response.text;
    messageElement.innerHTML = formatText(apiResponseText);

    // Update history
    chatHistory.push({ role: "user", parts: [{ text: userData.message || "Analyze image" }] });
    chatHistory.push({ role: "model", parts: [{ text: apiResponseText }] });

  } catch (error) {
    console.error("Gemini Error:", error);
    messageElement.innerText = "Error: " + (error.message || "Failed to get response");
    messageElement.style.color = "#dc3545";
  } finally {
    userData.file = { data: null, mime_type: null };
    incomingMessageDiv.classList.remove("thinking");
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
  }
};

const handleOutgoingMessage = (e) => {
  e.preventDefault();
  userData.message = messageInput.value.trim();
  if (!userData.message && !userData.file.data) return;

  const currentMessage = userData.message;
  const currentFile = { ...userData.file };

  messageInput.value = "";
  fileUploadWrapper.classList.remove("file-uploaded");
  imagePreview.style.display = "none";
  messageInput.style.height = "auto";

  const messageContent = `
    <div class="message-text">${currentMessage || ""}</div>
    ${currentFile.data ? `<img src="data:${currentFile.mime_type};base64,${currentFile.data}" class="attachment"/>` : ""}
  `;

  const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
  chatBody.appendChild(outgoingMessageDiv);
  chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

  // Add thinking indicator
  setTimeout(() => {
    const thinkingContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024" class="bot-avatar">
        <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
      </svg>
      <div class="message-text">
        <div class="thinking-indicator">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
    const incomingMessageDiv = createMessageElement(thinkingContent, "bot-message", "thinking");
    chatBody.appendChild(incomingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    generateBotResponse(incomingMessageDiv);
  }, 600);
};

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleOutgoingMessage(e);
  }
});

messageInput.addEventListener("input", () => {
    messageInput.style.height = "auto";
    messageInput.style.height = `${messageInput.scrollHeight}px`;
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    imagePreview.src = e.target.result;
    imagePreview.style.display = "block";
    fileUploadWrapper.classList.add("file-uploaded");
    const base64string = e.target.result.split(",")[1];

    userData.file = {
      data: base64string,
      mime_type: file.type,
    };
    fileInput.value = "";
  };
  reader.readAsDataURL(file);
});

fileCancelButton.addEventListener("click", () => {
  userData.file = { data: null, mime_type: null };
  fileUploadWrapper.classList.remove("file-uploaded");
  imagePreview.style.display = "none";
});

document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
