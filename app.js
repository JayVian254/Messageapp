
/**
 * Chat Application – Professional & Advanced JavaScript
 * Now includes floating action button to add contacts.
 */

(function () {
  "use strict";

  const STORAGE_KEY = "fakeMessenger_chats";

  const DEFAULT_CHATS = [
    { id: "c1", name: "Alex", message: "Where are you?", time: "9:41 PM", unread: 2 },
    { id: "c2", name: "Sarah", message: "Typing...", time: "8:12 PM", unread: 0 },
    { id: "c3", name: "Mike", message: "See you tomorrow", time: "Yesterday", unread: 1 }
  ];

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
    return DEFAULT_CHATS.map(chat => ({ ...chat }));
  }

  function saveChats(chats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error("Unable to save chats:", e);
    }
  }

  class ChatApp {
    constructor() {
      this.chats = loadChats();
      this.activeFilter = "";

      this.chatList = document.getElementById("chatList");
      this.searchInput = document.getElementById("search-input");
      this.searchButton = document.querySelector('.top-icons button[aria-label="Search chats"]');
      this.moreButton = document.querySelector('.top-icons button[aria-label="More options"]');
      this.fab = document.getElementById("addContactBtn");

      this.render = this.render.bind(this);
      this.handleSearch = this.handleSearch.bind(this);
      this.handleChatClick = this.handleChatClick.bind(this);
      this.focusSearch = this.focusSearch.bind(this);
      this.showMoreOptions = this.showMoreOptions.bind(this);
      this.handleAddContact = this.handleAddContact.bind(this);

      this.init();
    }

    init() {
      this.render();

      if (this.searchInput) {
        this.searchInput.addEventListener("input", this.handleSearch);
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

      if (this.chatList) {
        this.chatList.addEventListener("click", this.handleChatClick);
      }

      // Floating action button to add contact
      if (this.fab) {
        this.fab.addEventListener("click", this.handleAddContact);
      }
    }

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

    render() {
      if (!this.chatList) return;

      const filtered = this.getFilteredChats();
      const fragment = document.createDocumentFragment();

      filtered.forEach((chat, index) => {
        const firstLetter = chat.name.charAt(0);

        const chatItem = document.createElement("div");
        chatItem.classList.add("chat-item");
        chatItem.dataset.chatId = chat.id;
        chatItem.setAttribute("role", "listitem");
        chatItem.setAttribute("tabindex", "0");

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

        if (window.CSS && CSS.supports("animation", "fadeInUp 0.4s ease")) {
          chatItem.style.animation = `fadeInUp 0.3s ease ${index * 0.05}s both`;
        }

        fragment.appendChild(chatItem);
      });

      this.chatList.innerHTML = "";
      this.chatList.appendChild(fragment);

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

    handleChatClick(e) {
      const chatItem = e.target.closest(".chat-item");
      if (!chatItem) return;

      const chatId = chatItem.dataset.chatId;
      const chat = this.chats.find(c => c.id === chatId);
      if (!chat) return;

      if (chat.unread > 0) {
        chat.unread = 0;
        saveChats(this.chats);
        this.render();
      }

      console.log(`Opening conversation with ${chat.name}`);
    }

    focusSearch() {
      if (this.searchInput) {
        this.searchInput.focus();
        this.searchInput.select();
      }
    }

    showMoreOptions() {
      document.body.classList.toggle("dark-mode-enhanced");
      console.log("More options clicked – additional functionality can be hooked here.");
    }

    handleAddContact() {
      const name = prompt("Enter contact name:");
      if (!name || name.trim() === "") return;

      const message = prompt("Enter a short message:") || "Hey there!";
      const unreadInput = prompt("Unread count (number):", "0");
      const unread = parseInt(unreadInput, 10) || 0;

      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      this.addChat(name.trim(), message.trim(), time, unread);
    }

    escapeHTML(str) {
      const div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }

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

  document.addEventListener("DOMContentLoaded", () => {
    window.chatApp = new ChatApp();
  });

})();
