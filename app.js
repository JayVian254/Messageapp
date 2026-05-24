/**
 * Chat Application – Professional & Advanced JavaScript
 * Handles chat list rendering, search filtering, unread management,
 * and persistent data via localStorage with a clean modular architecture.
 *
 * Assumptions (based on existing HTML):
 *   - #chatList: container for chat items (<div> or <ul>)
 *   - #search-input: search field (type="search")
 *   - .top-icons button: search toggle & more options
 *   - Each chat item has .chat-item, .avatar, .chat-name, .chat-message,
 *     .chat-time, .unread
 */

(function () {
  "use strict";

  // --------------------------------------------
  // 1. Configuration & State
  // --------------------------------------------
  const STORAGE_KEY = "fakeMessenger_chats";

  // Default dataset – extended with unique IDs for robust tracking
  const DEFAULT_CHATS = [
    { id: "c1", name: "Alex", message: "Where are you?", time: "9:41 PM", unread: 2 },
    { id: "c2", name: "Sarah", message: "Typing...", time: "8:12 PM", unread: 0 },
    { id: "c3", name: "Mike", message: "See you tomorrow", time: "Yesterday", unread: 1 }
  ];

  // --------------------------------------------
  // 2. Data Management (with persistence)
  // --------------------------------------------
  function loadChats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Chat storage corrupted, resetting to defaults.");
    }
    // Deep clone defaults to avoid mutation
    return DEFAULT_CHATS.map(chat => ({ ...chat }));
  }

  function saveChats(chats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error("Unable to save chats:", e);
    }
  }

  // --------------------------------------------
  // 3. Chat Application Class
  // --------------------------------------------
  class ChatApp {
    constructor() {
      // State
      this.chats = loadChats();
      this.activeFilter = "";

      // DOM Elements
      this.chatList = document.getElementById("chatList");
      this.searchInput = document.getElementById("search-input");
      this.searchButton = document.querySelector('.top-icons button[aria-label="Search chats"]');
      this.moreButton = document.querySelector('.top-icons button[aria-label="More options"]');

      // Bind methods
      this.render = this.render.bind(this);
      this.handleSearch = this.handleSearch.bind(this);
      this.handleChatClick = this.handleChatClick.bind(this);
      this.focusSearch = this.focusSearch.bind(this);
      this.showMoreOptions = this.showMoreOptions.bind(this);

      // Initialize
      this.init();
    }

    init() {
      // Render immediately
      this.render();

      // Event Listeners
      if (this.searchInput) {
        this.searchInput.addEventListener("input", this.handleSearch);
        // Optional: clear search on Escape
        this.searchInput.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            this.searchInput.value = "";
            this.activeFilter = "";
            this.render();
            this.searchInput.blur();
          }
        });
      }

      if (this.searchButton) {
        this.searchButton.addEventListener("click", this.focusSearch);
      }

      if (this.moreButton) {
        this.moreButton.addEventListener("click", this.showMoreOptions);
      }

      // Use event delegation on chat list for clicks (works even after re-render)
      if (this.chatList) {
        this.chatList.addEventListener("click", this.handleChatClick);
      }
    }

    // --------------------------------------------
    // 4. Filtering Logic
    // --------------------------------------------
    getFilteredChats() {
      const filter = this.activeFilter.trim().toLowerCase();
      if (!filter) return this.chats;

      return this.chats.filter(chat =>
        chat.name.toLowerCase().includes(filter) ||
        chat.message.toLowerCase().includes(filter)
      );
    }

    handleSearch(e) {
      this.activeFilter = e.target.value;
      this.render();
    }

    // --------------------------------------------
    // 5. Render (efficient innerHTML + event safe)
    // --------------------------------------------
    render() {
      if (!this.chatList) return;

      const filtered = this.getFilteredChats();
      const fragment = document.createDocumentFragment();

      filtered.forEach((chat, index) => {
        const firstLetter = chat.name.charAt(0);

        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");
        chatItem.dataset.chatId = chat.id;         // for event delegation
        chatItem.setAttribute("role", "listitem"); // if using <ul> list, else "article"
        chatItem.setAttribute("tabindex", "0");    // make focusable

        // Use innerHTML for template – safe because data is internal
        chatItem.innerHTML = `
          <div class="avatar">${firstLetter}</div>
          <div class="chat-info">
            <div class="chat-top">
              <div class="chat-name">${this.escapeHTML(chat.name)}</div>
              <div class="chat-time">${this.escapeHTML(chat.time)}</div>
            </div>
            <div class="chat-message">${this.escapeHTML(chat.message)}</div>
          </div>
          ${chat.unread > 0 ? `<div class="unread">${chat.unread}</div>` : ""}
        `;

        // Add subtle entrance animation (CSS class) if present
        if (window.CSS && CSS.supports("animation", "fadeInUp 0.4s ease")) {
          chatItem.style.animation = `fadeInUp 0.3s ease ${index * 0.05}s both`;
        }

        fragment.appendChild(chatItem);
      });

      // Clear and update DOM in one operation
      this.chatList.innerHTML = "";
      this.chatList.appendChild(fragment);

      // Show a "no results" message if filtered empty
      if (filtered.length === 0 && this.activeFilter) {
        const emptyMsg = document.createElement("div");
        emptyMsg.className = "chat-item no-results";
        emptyMsg.textContent = "No chats match your search.";
        emptyMsg.style.color = "var(--text-muted)";
        emptyMsg.style.padding = "20px";
        emptyMsg.style.textAlign = "center";
        this.chatList.appendChild(emptyMsg);
      }
    }

    // --------------------------------------------
    // 6. Event Handlers
    // --------------------------------------------
    handleChatClick(e) {
      // Find closest chat item (delegation)
      const chatItem = e.target.closest(".chat-item");
      if (!chatItem) return;

      const chatId = chatItem.dataset.chatId;
      const chat = this.chats.find(c => c.id === chatId);
      if (!chat) return;

      // Advanced: clear unread count on click (open conversation)
      if (chat.unread > 0) {
        chat.unread = 0;
        saveChats(this.chats);   // persist immediately
        this.render();
      }

      // Simulate opening a chat (could be expanded with modal navigation)
      console.log(`Opening conversation with ${chat.name}`);
      // For demonstration we could alert, but better to be silent.
    }

    focusSearch() {
      if (this.searchInput) {
        this.searchInput.focus();
        this.searchInput.select();
      }
    }

    showMoreOptions() {
      // Simple example: toggle a dark mode class or show a tooltip
      document.body.classList.toggle("dark-mode-enhanced");
      console.log("More options clicked – additional functionality can be hooked here.");
    }

    // --------------------------------------------
    // 7. Utilities
    // --------------------------------------------
    escapeHTML(str) {
      const div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

    // Public method to add a chat (optional expansion)
    addChat(name, message, time, unread = 0) {
      const newChat = {
        id: "c" + Date.now() + Math.random().toString(36).substr(2, 9),
        name,
        message,
        time,
        unread
      };
      this.chats.unshift(newChat);
      saveChats(this.chats);
      this.render();
    }
  }

  // --------------------------------------------
  // 8. Initialization
  // --------------------------------------------
  document.addEventListener("DOMContentLoaded", () => {
    window.chatApp = new ChatApp();  // expose for debugging / external use
  });

})();
