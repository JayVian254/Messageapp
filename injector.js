(function () {

  "use strict";

  const STORAGE_KEY = "fakeMessenger_chats";

  const contactSelect =
    document.getElementById("contactSelect");

  const messageInput =
    document.getElementById("messageInput");

  const stateSelect =
    document.getElementById("stateSelect");

  const timeInput =
    document.getElementById("timeInput");

  const injectBtn =
    document.getElementById("injectBtn");

  const backBtn =
    document.getElementById("backBtn");

  let chats = [];

  // ---------- LOAD ----------

  function loadChats() {

    try {

      const saved =
        localStorage.getItem(STORAGE_KEY);

      chats = saved
        ? JSON.parse(saved)
        : [];

    } catch (e) {

      chats = [];

    }

  }

  // ---------- SAVE ----------

  function saveChats() {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );

  }

  // ---------- POPULATE CONTACTS ----------

  function populateContacts() {

    contactSelect.innerHTML = "";

    chats.forEach(chat => {

      const option =
        document.createElement("option");

      option.value = chat.id;

      option.textContent = chat.name;

      contactSelect.appendChild(option);

    });

  }

  // ---------- CURRENT TIME ----------

  function getCurrentTime() {

    return new Date().toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }

  // ---------- INJECT ----------

  function injectMessage() {

    const chatId =
      contactSelect.value;

    const text =
      messageInput.value.trim();

    const direction =
      document.querySelector(
        'input[name="direction"]:checked'
      ).value;

    const state =
      stateSelect.value;

    const time =
      timeInput.value.trim()
      || getCurrentTime();

    if (!text) {

      alert("Message required");

      return;

    }

    const chat =
      chats.find(c => c.id === chatId);

    if (!chat) return;

    // create messages array if missing
    if (!chat.messages) {

      chat.messages = [];

    }

    const newMessage = {

      text,
      direction,
      state,
      time

    };

    chat.messages.push(newMessage);

    saveChats();

    window.location.href =
      "index.html";

  }

  // ---------- EVENTS ----------

  injectBtn.addEventListener(
    "click",
    injectMessage
  );

  backBtn.addEventListener(
    "click",
    () => {
      window.location.href =
        "index.html";
    }
  );

  // ---------- INIT ----------

  loadChats();

  populateContacts();

})();
