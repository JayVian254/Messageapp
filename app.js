(function () {
  "use strict";

  const STORAGE_KEY = "fakeMessenger_chats";

  const DEFAULT_CHATS = [
  {
    id: "c1",
    name: "Alex",
    message: "Where are you?",
    time: "9:41 PM",
    unread: 2,
    pinned: false,
    muted: false,
    archived: false
  },
  {
    id: "c2",
    name: "Sarah",
    message: "Typing...",
    time: "8:12 PM",
    unread: 0,
    pinned: true,
    muted: false,
    archived: false
  },
  {
    id: "c3",
    name: "Mike",
    message: "See you tomorrow",
    time: "Yesterday",
    unread: 1,
    pinned: false,
    muted: false,
    archived: false
  }
];

  function loadChats() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Chat storage corrupted, resetting.");
    }
    return DEFAULT_CHATS.map(chat => ({ ...chat }));
  }

  function saveChats(chats) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error("Save failed", e);
    }
  }

  class ChatApp {
    constructor() {
      this.chats = loadChats();
      this.activeFilter = "";
      this.selectedChats = new Set();
      this.selectionMode = false;

      this.longPressTimer = null;
      this.longPressedChatId = null;

      this.tapCount = 0;
      this.tapTimer = null;
      this.appTitle = document.getElementById("app-title");

      this.contextMenu = document.getElementById("contextMenu");
      this.contextBackdrop = document.getElementById("contextBackdrop");

      this.pinBtn = document.getElementById("pinChatBtn");
      this.unreadBtn = document.getElementById("markUnreadBtn");
      this.muteBtn = document.getElementById("muteChatBtn");
      this.archiveBtn = document.getElementById("archiveChatBtn");
      this.deleteBtn = document.getElementById("deleteChatBtn");

      // DOM elements
      this.chatList = document.getElementById("chatList");
      this.searchInput = document.getElementById("search-input");
      this.hamburgerBtn = document.getElementById("hamburgerBtn");
      this.sideDrawer = document.getElementById("sideDrawer");
      this.drawerBackdrop = document.getElementById("drawerBackdrop");
      this.moreBtn = document.querySelector(".more-btn");
      this.fab = document.getElementById("addContactBtn");
      this.addModal = document.getElementById("addModal");
      this.cancelAddBtn = document.getElementById("cancelAddBtn");
      this.confirmAddBtn = document.getElementById("confirmAddBtn");
      this.newName = document.getElementById("newName");
      this.newMessage = document.getElementById("newMessage");
      this.newUnread = document.getElementById("newUnread");

      // Bind methods
      this.render = this.render.bind(this);
      this.handleSearch = this.handleSearch.bind(this);
      this.handleChatClick = this.handleChatClick.bind(this);
      this.toggleDrawer = this.toggleDrawer.bind(this);
      this.closeDrawer = this.closeDrawer.bind(this);
      this.openModal = this.openModal.bind(this);
      this.closeModal = this.closeModal.bind(this);
      this.confirmAdd = this.confirmAdd.bind(this);
      this.showMoreOptions = this.showMoreOptions.bind(this);

      this.init();
    }

    init() {
      document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    this.closeDrawer();
    this.closeModal();
  }
});
      const searchForm = document.querySelector(".search-box");

// Triple tap secret mode
if (this.appTitle) {
  this.appTitle.addEventListener(
    "click",
    this.handleSecretTap.bind(this)
  );
}

// Long press handling
if (this.chatList) {

  this.chatList.addEventListener("pointerdown", (e) => {

    const item = e.target.closest(".chat-item");

    if (!item) return;

    const chatId = item.dataset.chatId;

    this.longPressTimer = setTimeout(() => {

      navigator.vibrate?.(50);

      this.longPressedChatId = chatId;

      this.openContextMenu();

    }, 500);

  });

  this.chatList.addEventListener("pointerup", () => {
    clearTimeout(this.longPressTimer);
  });

  this.chatList.addEventListener("pointerleave", () => {
    clearTimeout(this.longPressTimer);
  });

}

// Context menu buttons
this.pinBtn?.addEventListener(
  "click",
  () => this.togglePin()
);

this.unreadBtn?.addEventListener(
  "click",
  () => this.markUnread()
);

this.muteBtn?.addEventListener(
  "click",
  () => this.toggleMute()
);

this.archiveBtn?.addEventListener(
  "click",
  () => this.archiveChat()
);

this.deleteBtn?.addEventListener(
  "click",
  () => this.deleteChat()
);

this.contextBackdrop?.addEventListener(
  "click",
  () => this.closeContextMenu()
);

if (searchForm) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
  });
}
      this.render();

      // Search
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

      // Hamburger toggle
      if (this.hamburgerBtn) {
        this.hamburgerBtn.addEventListener("click", this.toggleDrawer);
      }
      if (this.drawerBackdrop) {
        this.drawerBackdrop.addEventListener("click", this.closeDrawer);
      }

      // More button
      if (this.moreBtn) {
        this.moreBtn.addEventListener("click", this.showMoreOptions);
      }

      // Chat list delegation
      if (this.chatList) {
        this.chatList.addEventListener("click", this.handleChatClick);
      }

      // FAB opens modal
      if (this.fab) {
        this.fab.addEventListener("click", this.openModal);
      }

      // Modal buttons
      if (this.cancelAddBtn) {
        this.cancelAddBtn.addEventListener("click", this.closeModal);
      }
      if (this.confirmAddBtn) {
        this.confirmAddBtn.addEventListener("click", this.confirmAdd);
      }

      // Close modal on overlay click
      if (this.addModal) {
        this.addModal.addEventListener("click", (e) => {
          if (e.target === this.addModal) this.closeModal();
        });
      }
    }

    // ---------- Search ----------
    handleSearch(e) {
      this.activeFilter = e.target.value;
      this.render();
    }

    getFilteredChats() {

  const filter =
    this.activeFilter.trim().toLowerCase();

  let chats =
    this.chats.filter(chat => !chat.archived);

  if (filter) {

    chats = chats.filter(chat =>

      chat.name.toLowerCase().includes(filter)
      ||
      chat.message.toLowerCase().includes(filter)

    );

  }

  chats.sort((a, b) => {

    if (a.pinned && !b.pinned) return -1;

    if (!a.pinned && b.pinned) return 1;

    return 0;

  });

  return chats;

}

    // ---------- Render ----------
    render() {
      if (!this.chatList) return;

      const filtered = this.getFilteredChats();
      const fragment = document.createDocumentFragment();

      filtered.forEach((chat, index) => {
        const firstLetter = chat.name.charAt(0);
        const chatItem = document.createElement("li");
        chatItem.classList.add("chat-item");
        if (chat.pinned) {
  chatItem.classList.add("pinned");
}

if (chat.muted) {
  chatItem.classList.add("muted");
}

if (this.selectedChats.has(chat.id)) {
  chatItem.classList.add("selected");
}
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

  const chatItem =
    e.target.closest(".chat-item");

  if (!chatItem) return;

  const chatId =
    chatItem.dataset.chatId;

  const chat =
    this.chats.find(c => c.id === chatId);

  if (!chat) return;

  // Selection mode
  if (this.selectionMode) {

    if (this.selectedChats.has(chatId)) {

      this.selectedChats.delete(chatId);

    } else {

      this.selectedChats.add(chatId);

    }

    if (this.selectedChats.size === 0) {

      this.selectionMode = false;

    }

    this.render();

    return;

  }

  // Open future conversation page
  window.location.href =
    `chat.html?id=${chatId}`;

}

    // ---------- Drawer ----------
    toggleDrawer() {
      this.sideDrawer.classList.toggle("open");
      this.drawerBackdrop.classList.toggle("visible");
    }
    closeDrawer() {
      this.sideDrawer.classList.remove("open");
      this.drawerBackdrop.classList.remove("visible");
    }

    showMoreOptions() {
      document.body.classList.toggle("dark-mode-enhanced");
      console.log("More options toggled");
    }

    // ---------- Add Contact Modal ----------
    openModal() {
      this.addModal.classList.add("active");
      this.newName.focus();
    }
    closeModal() {
      this.addModal.classList.remove("active");
      this.newName.value = "";
      this.newMessage.value = "";
      this.newUnread.value = "0";
    }
    confirmAdd() {
      const name = this.newName.value.trim();
      if (!name) {
        alert("Name is required");
        return;
      }
      const message = this.newMessage.value.trim() || "Hey there!";
      const unread = parseInt(this.newUnread.value, 10) || 0;
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      this.addChat(name, message, time, unread);
      this.closeModal();
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

    escapeHTML(str) {
      const div = document.createElement("div");
      div.appendChild(document.createTextNode(str));
      return div.innerHTML;
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.chatApp = new ChatApp();
  });
})();
