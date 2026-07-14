<template>
  <div class="chat-widget">
    <!-- FLOATING BUTTON -->
    <button
      type="button"
      class="chat-fab"
      :class="{ 'chat-fab--open': isOpen }"
      @click="togglePanel"
      title="Chat dengan Judge"
    >
      <transition name="chat-fab-icon" mode="out-in">
        <Icon v-if="!isOpen" key="chat" icon="mdi:chat-processing-outline" width="24" height="24" />
        <Icon v-else key="close" icon="mdi:chevron-down" width="26" height="26" />
      </transition>
      <span v-if="!isOpen && totalUnread > 0" class="chat-fab-badge">{{
        totalUnread > 99 ? "99+" : totalUnread
      }}</span>
    </button>

    <!-- PANEL -->
    <transition name="chat-panel-fade">
      <div
        v-if="isOpen"
        class="chat-panel"
        :class="{ 'chat-panel--expanded': isExpanded }"
      >
        <div class="chat-panel-header">
          <div class="chat-panel-header-main">
            <div class="chat-panel-avatar">
              <Icon icon="mdi:timer-outline" width="20" height="20" />
            </div>
            <div class="chat-panel-heading">
              <div class="chat-panel-title">Timing System</div>
              <div class="chat-panel-subtitle">
                <span class="chat-status-dot"></span>
                {{ activeCategoryLabel ? `Ruang ${activeCategoryLabel}` : "Judge Channel" }}
              </div>
            </div>
          </div>
          <div class="chat-panel-actions">
            <button
              type="button"
              class="chat-icon-btn"
              :class="{ 'chat-icon-btn--active': showMembers }"
              title="Anggota"
              @click="showMembers = !showMembers"
            >
              <Icon icon="mdi:account-group-outline" width="17" height="17" />
              <span v-if="members.length" class="chat-icon-btn-count">{{
                members.length
              }}</span>
            </button>
            <button
              type="button"
              class="chat-icon-btn"
              :title="isExpanded ? 'Perkecil' : 'Perbesar'"
              @click="toggleExpand"
            >
              <Icon
                :icon="isExpanded ? 'mdi:arrow-collapse' : 'mdi:arrow-expand'"
                width="16"
                height="16"
              />
            </button>
            <button type="button" class="chat-icon-btn" title="Tutup" @click="togglePanel">
              <Icon icon="mdi:close" width="17" height="17" />
            </button>
          </div>
        </div>

        <!-- CATEGORY TABS (satu grup chat per Race Category) -->
        <div v-if="enabledCategories.length" class="chat-tabs">
          <button
            v-for="c in enabledCategories"
            :key="c.key"
            type="button"
            class="chat-tab"
            :class="{ 'chat-tab--active': activeCategoryKey === c.key }"
            @click="selectCategory(c.key)"
          >
            {{ c.label }}
            <span v-if="unreadByCategory[c.key]" class="chat-tab-dot"></span>
          </button>
        </div>

        <div v-if="!enabledCategories.length" class="chat-placeholder">
          <Icon icon="mdi:flag-checkered" width="32" height="32" />
          <p>Event ini belum punya Race Category aktif.</p>
        </div>

        <template v-else>
          <!-- MEMBERS SIDEBAR (judge yang terdaftar utk kategori aktif) -->
          <transition name="chat-view-fade" mode="out-in">
            <div v-if="showMembers" key="members" class="chat-members">
              <div class="chat-members-title">
                Judge &middot; {{ activeCategoryLabel }}
              </div>
              <div v-if="!members.length" class="chat-placeholder chat-placeholder--compact">
                <Icon icon="mdi:account-search-outline" width="26" height="26" />
                <p>Belum ada judge yang di-assign untuk kategori ini di Judge Settings.</p>
              </div>
              <div v-for="m in members" :key="m.email" class="chat-member-row">
                <div
                  class="chat-avatar chat-avatar--sm"
                  :style="{ background: avatarColor(m.username || m.email) }"
                >
                  {{ initials(m.username || m.email) }}
                </div>
                <div class="chat-member-info">
                  <div class="chat-member-name">{{ m.username || m.email }}</div>
                  <div class="chat-member-role">
                    <Icon icon="mdi:gavel" width="11" height="11" />
                    {{ m.role }}
                  </div>
                </div>
              </div>
            </div>

            <!-- MESSAGE STREAM -->
            <div v-else key="messages" class="chat-body">
              <div ref="messageList" class="chat-messages">
                <div v-if="loadingMessages" class="chat-placeholder chat-placeholder--compact">
                  <b-spinner small />
                  <p>Memuat pesan...</p>
                </div>
                <div
                  v-else-if="!activeMessages.length"
                  class="chat-placeholder chat-placeholder--compact"
                >
                  <Icon icon="mdi:message-text-outline" width="28" height="28" />
                  <p>Belum ada pesan di ruang {{ activeCategoryLabel }}.<br />Mulai obrolan dengan judge.</p>
                </div>

                <div
                  v-for="(m, idx) in activeMessages"
                  :key="m._id || idx"
                  class="chat-row"
                  :class="{ 'chat-row--own': m.senderEmail === ADMIN_EMAIL }"
                >
                  <div
                    class="chat-avatar chat-avatar--sm"
                    :style="{ background: avatarColor(m.senderName) }"
                  >
                    {{ initials(m.senderName) }}
                  </div>
                  <div class="chat-message">
                    <div class="chat-message-meta">
                      <span class="chat-message-name">{{ m.senderName }}</span>
                      <span class="chat-message-time">{{ formatTime(m.createdAt) }}</span>
                    </div>
                    <div class="chat-message-bubble">
                      <span
                        v-for="(tok, ti) in renderMessageTokens(m.text)"
                        :key="ti"
                        :class="{ 'chat-mention': tok.mention }"
                        >{{ tok.text }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <div class="chat-composer-wrap">
                <div
                  v-if="showMentionList && mentionSuggestions.length"
                  class="chat-mention-list"
                >
                  <button
                    v-for="(m, mi) in mentionSuggestions"
                    :key="m.email"
                    type="button"
                    class="chat-mention-item"
                    :class="{ 'chat-mention-item--active': mi === mentionActiveIndex }"
                    @mousedown.prevent="selectMention(m)"
                  >
                    <div
                      class="chat-avatar chat-avatar--xs"
                      :style="{ background: avatarColor(m.username || m.email) }"
                    >
                      {{ initials(m.username || m.email) }}
                    </div>
                    <span class="chat-mention-item-name">{{ m.username || m.email }}</span>
                    <span class="chat-mention-item-role">{{ m.role }}</span>
                  </button>
                </div>

                <form class="chat-composer" @submit.prevent="sendMessage">
                  <input
                    ref="composerInput"
                    v-model="draft"
                    type="text"
                    class="chat-composer-input"
                    :placeholder="`Kirim ke judge ${activeCategoryLabel}... (ketik @ untuk sebut nama)`"
                    :disabled="sending"
                    @input="onDraftInput"
                    @keydown="onComposerKeydown"
                    @blur="onComposerBlur"
                  />
                  <button
                    type="submit"
                    class="chat-send-btn"
                    :disabled="sending || !draft.trim()"
                    title="Kirim"
                  >
                    <Icon v-if="!sending" icon="mdi:send" width="17" height="17" />
                    <b-spinner v-else small variant="light" />
                  </button>
                </form>
              </div>
            </div>
          </transition>
        </template>
      </div>
    </transition>
  </div>
</template>

<script>
import { ipcRenderer } from "electron";
import { Icon } from "@iconify/vue2";
import { getSocket } from "@/services/socket";
import tone from "@/assets/tone/tone_message.mp3";

const ADMIN_EMAIL = "timing-system@internal";
const ADMIN_NAME = "Timing System";
const EXPANDED_STORAGE_KEY = "chatWidgetExpanded";

const CATEGORY_DEFS = [
  { key: "sprint", eventName: "SPRINT", label: "Sprint" },
  { key: "h2h", eventName: "HEAD2HEAD", label: "Head to Head" },
  { key: "slalom", eventName: "SLALOM", label: "Slalom" },
  { key: "drr", eventName: "DRR", label: "Down River" },
  { key: "rx", eventName: "RX", label: "Rafting Cross" },
];

const AVATAR_PALETTE = [
  "#1874a5",
  "#148a3b",
  "#a5581a",
  "#7c3aed",
  "#d9534f",
  "#0d9488",
  "#be185d",
  "#4b5563",
];

function categoryRoleLabel(entry, key) {
  if (!entry) return "";
  const obj = entry[key];
  if (!obj) return "";
  const parts = [];
  if (obj.start === true) parts.push("Start");
  if (obj.finish === true) parts.push("Finish");
  if (Array.isArray(obj.gates)) {
    const n = obj.gates.filter(Boolean).length;
    if (n > 0) parts.push(`Gate x${n}`);
  }
  if (Array.isArray(obj.sections)) {
    const n = obj.sections.filter(Boolean).length;
    if (n > 0) parts.push(`Section x${n}`);
  }
  if (obj.gate1 === true) parts.push("Gate 1");
  if (obj.gate2 === true) parts.push("Gate 2");
  ["R1", "R2", "L1", "L2"].forEach((k) => {
    if (obj[k] === true) parts.push(k);
  });
  return parts.join(", ");
}

export default {
  name: "EventChatWidget",
  components: { Icon },
  props: {
    eventId: { type: String, default: "" },
  },
  data() {
    return {
      ADMIN_EMAIL,
      isOpen: false,
      isExpanded: localStorage.getItem(EXPANDED_STORAGE_KEY) === "1",
      showMembers: false,
      categoriesEvent: [],
      judgeAssignments: [], // raw docs dari users-judges-assignment:listByEvent
      activeCategoryKey: "",
      messagesByCategory: {}, // { [categoryKey]: [] }
      loadingMessages: false,
      draft: "",
      sending: false,
      unreadByCategory: {},
      selfSocketId: null,
      initSocket: null,
      // @mention autocomplete
      showMentionList: false,
      mentionQuery: "",
      mentionStartIndex: -1,
      mentionActiveIndex: 0,
    };
  },
  computed: {
    enabledCategories() {
      const enabledKeys = new Set(
        (this.categoriesEvent || []).map((e) =>
          String((e && e.name) || "").toUpperCase()
        )
      );
      // kalau event belum punya categoriesEvent tersimpan, tampilkan semua
      if (!enabledKeys.size) return CATEGORY_DEFS;
      return CATEGORY_DEFS.filter((c) => enabledKeys.has(c.eventName));
    },
    activeCategoryLabel() {
      const c = this.enabledCategories.find(
        (x) => x.key === this.activeCategoryKey
      );
      return c ? c.label : "";
    },
    members() {
      if (!this.activeCategoryKey) return [];
      const key = this.activeCategoryKey;
      const out = [];
      this.judgeAssignments.forEach((doc) => {
        const entry =
          doc && doc.judges && doc.judges.length ? doc.judges[0] : null;
        const role = categoryRoleLabel(entry, key);
        if (role) {
          out.push({
            email: doc.email,
            username: doc.username,
            role,
          });
        }
      });
      return out;
    },
    activeMessages() {
      return this.messagesByCategory[this.activeCategoryKey] || [];
    },
    mentionSuggestions() {
      if (!this.showMentionList) return [];
      const q = this.mentionQuery.toLowerCase();
      return this.members
        .filter((m) => String(m.username || m.email || "").toLowerCase().includes(q))
        .slice(0, 6);
    },
    totalUnread() {
      return Object.values(this.unreadByCategory).reduce(
        (a, b) => a + (b || 0),
        0
      );
    },
  },
  watch: {
    eventId() {
      this.resetEventState();
      if (this.eventId) this.loadEventContext();
    },
  },
  mounted() {
    if (this.eventId) this.loadEventContext();
    this.initRealtime();
  },
  beforeDestroy() {
    if (this.initSocket) {
      this.initSocket.off("connect", this._onSocketConnect);
      this.initSocket.off("custom:event", this._onSocketMessage);
    }
  },
  methods: {
    resetEventState() {
      this.categoriesEvent = [];
      this.judgeAssignments = [];
      this.activeCategoryKey = "";
      this.messagesByCategory = {};
      this.unreadByCategory = {};
      this.showMembers = false;
      this.showMentionList = false;
    },

    loadEventContext() {
      if (typeof ipcRenderer === "undefined" || !this.eventId) return;

      // Channel khusus milik widget ini (lihat catatan di ipcMainServices.js)
      // — SENGAJA tidak removeAllListeners di sini karena widget ini mounted
      // permanen di semua halaman event; membersihkan listener pada channel
      // bersama bisa menghapus listener milik komponen lain yang sedang
      // menunggu balasan (ini penyebab bug event detail sebelumnya).
      ipcRenderer.send("chat:get-event", this.eventId);
      ipcRenderer.once("chat:get-event-reply", (_e, res) => {
        this.categoriesEvent =
          res && Array.isArray(res.categoriesEvent) ? res.categoriesEvent : [];
        if (!this.activeCategoryKey && this.enabledCategories.length) {
          this.activeCategoryKey = this.enabledCategories[0].key;
          if (this.isOpen) this.loadMessagesForActiveCategory();
        }
      });

      // "users-judges-assignment:listByEvent" dipakai juga oleh JudgesSettings.vue
      // — jangan removeAllListeners di sini demi alasan yang sama di atas.
      ipcRenderer.send("users-judges-assignment:listByEvent", {
        eventId: this.eventId,
      });
      ipcRenderer.once(
        "users-judges-assignment:listByEvent:reply",
        (_e, res) => {
          if (res && res.ok && Array.isArray(res.items)) {
            this.judgeAssignments = res.items;
          }
        }
      );
    },

    togglePanel() {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.showMembers = false;
        if (this.activeCategoryKey) {
          this.unreadByCategory = {
            ...this.unreadByCategory,
            [this.activeCategoryKey]: 0,
          };
          if (!this.messagesByCategory[this.activeCategoryKey]) {
            this.loadMessagesForActiveCategory();
          } else {
            this.$nextTick(() => this.scrollToBottom());
          }
        }
      }
    },

    toggleExpand() {
      this.isExpanded = !this.isExpanded;
      localStorage.setItem(EXPANDED_STORAGE_KEY, this.isExpanded ? "1" : "0");
      this.$nextTick(() => this.scrollToBottom());
    },

    selectCategory(key) {
      this.activeCategoryKey = key;
      this.showMembers = false;
      this.showMentionList = false;
      this.unreadByCategory = { ...this.unreadByCategory, [key]: 0 };
      if (!this.messagesByCategory[key]) {
        this.loadMessagesForActiveCategory();
      } else {
        this.$nextTick(() => this.scrollToBottom());
      }
    },

    loadMessagesForActiveCategory() {
      if (typeof ipcRenderer === "undefined" || !this.eventId || !this.activeCategoryKey)
        return;
      const category = this.activeCategoryKey;
      this.loadingMessages = true;
      ipcRenderer.removeAllListeners("chat:listByEvent:reply");
      ipcRenderer.send("chat:listByEvent", { eventId: this.eventId, category });
      ipcRenderer.once("chat:listByEvent:reply", (_e, res) => {
        this.loadingMessages = false;
        if (res && res.ok && Array.isArray(res.messages)) {
          this.$set(this.messagesByCategory, category, res.messages);
          this.$nextTick(() => this.scrollToBottom());
        }
      });
    },

    sendMessage() {
      const text = this.draft.trim();
      const category = this.activeCategoryKey;
      if (!text || !category || typeof ipcRenderer === "undefined") return;

      this.sending = true;
      const payload = {
        eventId: this.eventId,
        category,
        senderEmail: ADMIN_EMAIL,
        senderName: ADMIN_NAME,
        text,
      };

      ipcRenderer.removeAllListeners("chat:send:reply");
      ipcRenderer.send("chat:send", payload);
      ipcRenderer.once("chat:send:reply", (_e, res) => {
        this.sending = false;
        if (res && res.ok && res.message) {
          const list = this.messagesByCategory[category] || [];
          this.$set(this.messagesByCategory, category, [...list, res.message]);
          this.draft = "";
          this.showMentionList = false;
          this.$nextTick(() => this.scrollToBottom());

          try {
            const socket = getSocket();
            socket.emit("custom:event", {
              type: "chat",
              eventId: this.eventId,
              category,
              senderId: socket.id,
              senderEmail: res.message.senderEmail,
              senderName: res.message.senderName,
              text: res.message.text,
              _id: res.message._id,
              createdAt: res.message.createdAt,
            });
          } catch (err) {
            // gagal broadcast realtime bukan fatal — pesan sudah tersimpan
          }
        }
      });
    },

    /* =========================================================
     * @MENTION AUTOCOMPLETE
     * =======================================================*/
    onDraftInput() {
      const input = this.$refs.composerInput;
      const cursorPos = input ? input.selectionStart : this.draft.length;
      const textBeforeCursor = this.draft.slice(0, cursorPos);
      const atMatch = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/);
      if (atMatch) {
        this.mentionQuery = atMatch[1];
        this.mentionStartIndex = cursorPos - atMatch[1].length - 1;
        this.mentionActiveIndex = 0;
        this.showMentionList = true;
      } else {
        this.showMentionList = false;
      }
    },

    onComposerKeydown(e) {
      if (!this.showMentionList || !this.mentionSuggestions.length) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        this.mentionActiveIndex =
          (this.mentionActiveIndex + 1) % this.mentionSuggestions.length;
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        this.mentionActiveIndex =
          (this.mentionActiveIndex - 1 + this.mentionSuggestions.length) %
          this.mentionSuggestions.length;
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        this.selectMention(this.mentionSuggestions[this.mentionActiveIndex]);
      } else if (e.key === "Escape") {
        this.showMentionList = false;
      }
    },

    onComposerBlur() {
      // delay supaya klik di item mention (mousedown) sempat diproses dulu
      setTimeout(() => {
        this.showMentionList = false;
      }, 150);
    },

    selectMention(member) {
      if (!member) return;
      const name = member.username || member.email;
      const before = this.draft.slice(0, this.mentionStartIndex);
      const after = this.draft.slice(
        this.mentionStartIndex + 1 + this.mentionQuery.length
      );
      this.draft = `${before}@${name} ${after}`;
      this.showMentionList = false;

      this.$nextTick(() => {
        const input = this.$refs.composerInput;
        if (input) {
          input.focus();
          const pos = before.length + name.length + 2;
          input.setSelectionRange(pos, pos);
        }
      });
    },

    renderMessageTokens(text) {
      const str = String(text || "");
      const names = this.members
        .map((m) => m.username || m.email)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

      if (!names.length) return [{ mention: false, text: str }];

      const escaped = names.map((n) =>
        String(n).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      );
      const re = new RegExp("@(" + escaped.join("|") + ")(?=\\s|$)", "g");
      const tokens = [];
      let lastIndex = 0;
      let match = re.exec(str);
      while (match) {
        if (match.index > lastIndex) {
          tokens.push({ mention: false, text: str.slice(lastIndex, match.index) });
        }
        tokens.push({ mention: true, text: match[0] });
        lastIndex = match.index + match[0].length;
        match = re.exec(str);
      }
      if (lastIndex < str.length) {
        tokens.push({ mention: false, text: str.slice(lastIndex) });
      }
      return tokens.length ? tokens : [{ mention: false, text: str }];
    },

    initRealtime() {
      try {
        const socket = getSocket();
        this.initSocket = socket;

        this._onSocketConnect = () => {
          this.selfSocketId = socket && socket.id ? socket.id : null;
        };
        socket.on("connect", this._onSocketConnect);

        this._onSocketMessage = (raw) => {
          const msg = raw || {};
          if (msg.type !== "chat") return;
          if (
            msg.senderId &&
            this.selfSocketId &&
            msg.senderId === this.selfSocketId
          )
            return;
          if (String(msg.eventId || "") !== String(this.eventId || "")) return;

          const category = String(msg.category || "");
          if (!category) return;

          const list = this.messagesByCategory[category] || [];
          if (msg._id && list.some((m) => m._id === msg._id)) return;

          this.$set(this.messagesByCategory, category, [
            ...list,
            {
              _id: msg._id,
              senderEmail: msg.senderEmail,
              senderName: msg.senderName,
              text: msg.text,
              createdAt: msg.createdAt,
            },
          ]);

          const isActiveAndVisible =
            this.isOpen && !this.showMembers && this.activeCategoryKey === category;

          if (isActiveAndVisible) {
            this.$nextTick(() => this.scrollToBottom());
          } else {
            this.unreadByCategory = {
              ...this.unreadByCategory,
              [category]: (this.unreadByCategory[category] || 0) + 1,
            };
          }

          try {
            new Audio(tone).play();
          } catch (err) {
            // gagal play audio bukan fatal
          }

          if (this.$bvToast) {
            const catLabel =
              (CATEGORY_DEFS.find((c) => c.key === category) || {}).label ||
              category;
            this.$bvToast.toast(`${msg.senderName || "Judge"}: ${msg.text}`, {
              title: `Pesan Baru — ${catLabel}`,
              variant: "info",
              solid: true,
            });
          }
        };
        socket.on("custom:event", this._onSocketMessage);
      } catch (err) {
        // socket opsional — chat tetap bisa dipakai tanpa realtime
      }
    },

    scrollToBottom() {
      const el = this.$refs.messageList;
      if (el) el.scrollTop = el.scrollHeight;
    },

    formatTime(dt) {
      if (!dt) return "";
      const d = new Date(dt);
      if (isNaN(d.getTime())) return "";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    },

    initials(name) {
      const s = String(name || "").trim();
      if (!s) return "?";
      const parts = s.split(/\s+/).filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return (parts[0][0] + parts[1][0]).toUpperCase();
    },

    avatarColor(name) {
      const s = String(name || "");
      let hash = 0;
      for (let i = 0; i < s.length; i++) {
        hash = (hash << 5) - hash + s.charCodeAt(i);
        hash |= 0;
      }
      const idx = Math.abs(hash) % AVATAR_PALETTE.length;
      return AVATAR_PALETTE[idx];
    },
  },
};
</script>

<style scoped>
.chat-widget {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1050;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
    Arial, sans-serif;
}

/* ===== FLOATING BUTTON ===== */
.chat-fab {
  width: 58px;
  height: 58px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #1c8fc7 0%, #145f87 100%);
  color: #fff;
  box-shadow: 0 10px 24px rgba(24, 116, 165, 0.38), 0 2px 6px rgba(0, 0, 0, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}
.chat-fab:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 14px 28px rgba(24, 116, 165, 0.45), 0 3px 8px rgba(0, 0, 0, 0.14);
}
.chat-fab:active {
  transform: translateY(0) scale(0.98);
}
.chat-fab--open {
  background: linear-gradient(135deg, #145f87 0%, #0e4a6b 100%);
}
.chat-fab-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  background: #e5484d;
  color: #fff;
  border: 2px solid #fff;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 700;
  padding: 1px 5px;
  min-width: 20px;
  text-align: center;
  box-shadow: 0 2px 6px rgba(229, 72, 77, 0.5);
}
.chat-fab-icon-enter-active,
.chat-fab-icon-leave-active {
  transition: opacity 0.12s ease, transform 0.12s ease;
}
.chat-fab-icon-enter {
  opacity: 0;
  transform: scale(0.6) rotate(-45deg);
}
.chat-fab-icon-leave-to {
  opacity: 0;
  transform: scale(0.6) rotate(45deg);
}

/* ===== PANEL ===== */
.chat-panel {
  position: absolute;
  right: 0;
  bottom: 74px;
  width: 352px;
  max-height: 560px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 20px 48px rgba(15, 30, 45, 0.2), 0 4px 12px rgba(15, 30, 45, 0.08);
  border: 1px solid rgba(15, 30, 45, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  transition: width 0.22s cubic-bezier(0.34, 1.2, 0.64, 1),
    max-height 0.22s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.chat-panel--expanded {
  width: min(92vw, 560px);
  max-height: min(88vh, 760px);
}
.chat-panel-fade-enter-active {
  transition: opacity 0.2s ease, transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.chat-panel-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.chat-panel-fade-enter,
.chat-panel-fade-leave-to {
  opacity: 0;
  transform: scale(0.92) translateY(10px);
}

.chat-view-fade-enter-active,
.chat-view-fade-leave-active {
  transition: opacity 0.15s ease;
}
.chat-view-fade-enter,
.chat-view-fade-leave-to {
  opacity: 0;
}

/* ===== HEADER ===== */
.chat-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  background: linear-gradient(135deg, #1c8fc7 0%, #145f87 100%);
  color: #fff;
  flex-shrink: 0;
}
.chat-panel-header-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.chat-panel-avatar {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-panel-heading {
  min-width: 0;
}
.chat-panel-title {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.3;
}
.chat-panel-subtitle {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.82);
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(74, 222, 128, 0.25);
}

.chat-panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.chat-icon-btn {
  background: rgba(255, 255, 255, 0.12);
  border: none;
  color: #fff;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 6px 8px;
  border-radius: 8px;
  transition: background 0.15s ease;
}
.chat-icon-btn:hover {
  background: rgba(255, 255, 255, 0.24);
}
.chat-icon-btn--active {
  background: rgba(255, 255, 255, 0.3);
}
.chat-icon-btn-count {
  font-variant-numeric: tabular-nums;
}

/* ===== CATEGORY TABS ===== */
.chat-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  padding: 8px 10px;
  background: #f7f9fb;
  border-bottom: 1px solid #eef1f5;
  flex-shrink: 0;
  scrollbar-width: none;
}
.chat-tabs::-webkit-scrollbar {
  display: none;
}
.chat-tab {
  border: none;
  background: #fff;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #6a7280;
  white-space: nowrap;
  cursor: pointer;
  border-radius: 999px;
  box-shadow: 0 0 0 1px rgba(15, 30, 45, 0.08);
  transition: all 0.15s ease;
  position: relative;
}
.chat-tab:hover {
  color: #1874a5;
  box-shadow: 0 0 0 1px rgba(24, 116, 165, 0.3);
}
.chat-tab--active {
  color: #fff;
  background: #1874a5;
  box-shadow: 0 2px 8px rgba(24, 116, 165, 0.35);
}
.chat-tab-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #e5484d;
  margin-left: 5px;
  vertical-align: middle;
}
.chat-tab--active .chat-tab-dot {
  background: #fff;
}

/* ===== PLACEHOLDER / EMPTY STATES ===== */
.chat-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 36px 24px;
  text-align: center;
  color: #9aa3af;
  flex: 1;
}
.chat-placeholder--compact {
  padding: 24px 20px;
}
.chat-placeholder p {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.5;
}

/* ===== MEMBERS ===== */
.chat-members {
  overflow-y: auto;
  padding: 6px 0 10px;
  flex: 1;
}
.chat-members-title {
  font-weight: 700;
  font-size: 11px;
  color: #9aa3af;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 10px 14px 6px;
}
.chat-member-row {
  padding: 9px 14px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.12s ease;
}
.chat-member-row:hover {
  background: #f7f9fb;
}
.chat-member-info {
  min-width: 0;
}
.chat-member-name {
  font-weight: 600;
  font-size: 13px;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chat-member-role {
  font-size: 11px;
  color: #1874a5;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
}

/* ===== AVATAR ===== */
.chat-avatar {
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
  letter-spacing: 0.2px;
}
.chat-avatar--sm {
  width: 30px;
  height: 30px;
  font-size: 11px;
}
.chat-avatar--xs {
  width: 22px;
  height: 22px;
  font-size: 9px;
}

/* ===== MENTIONS ===== */
.chat-mention {
  color: #1874a5;
  font-weight: 700;
  background: rgba(24, 116, 165, 0.1);
  border-radius: 4px;
  padding: 0 2px;
}
.chat-row--own .chat-message-bubble .chat-mention {
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
}

/* ===== MESSAGE STREAM ===== */
.chat-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  min-height: 260px;
  background: #fbfcfd;
  display: flex;
  flex-direction: column;
}
.chat-messages::-webkit-scrollbar {
  width: 5px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(15, 30, 45, 0.15);
  border-radius: 999px;
}

.chat-row {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
  align-items: flex-start;
}
.chat-row--own {
  flex-direction: row-reverse;
}

.chat-message {
  min-width: 0;
  max-width: 76%;
}
.chat-row--own .chat-message {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.chat-message-meta {
  display: flex;
  gap: 6px;
  align-items: baseline;
  font-size: 10.5px;
  color: #9aa3af;
  margin-bottom: 3px;
  padding: 0 2px;
}
.chat-row--own .chat-message-meta {
  flex-direction: row-reverse;
}
.chat-message-name {
  font-weight: 700;
  color: #374151;
}
.chat-message-bubble {
  font-size: 13px;
  line-height: 1.45;
  background: #fff;
  color: #1f2937;
  border: 1px solid #eef1f5;
  border-radius: 14px 14px 14px 4px;
  padding: 8px 12px;
  display: inline-block;
  word-break: break-word;
  box-shadow: 0 1px 2px rgba(15, 30, 45, 0.04);
}
.chat-row--own .chat-message-bubble {
  background: linear-gradient(135deg, #1c8fc7 0%, #1874a5 100%);
  color: #fff;
  border: none;
  border-radius: 14px 14px 4px 14px;
}

/* ===== COMPOSER ===== */
.chat-composer-wrap {
  position: relative;
  flex-shrink: 0;
}
.chat-mention-list {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 100%;
  margin-bottom: 6px;
  background: #fff;
  border: 1px solid #eef1f5;
  border-radius: 12px;
  box-shadow: 0 10px 28px rgba(15, 30, 45, 0.16);
  overflow: hidden;
  max-height: 200px;
  overflow-y: auto;
  z-index: 5;
}
.chat-mention-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: none;
  background: #fff;
  cursor: pointer;
  text-align: left;
}
.chat-mention-item:hover,
.chat-mention-item--active {
  background: #f0f6fa;
}
.chat-mention-item-name {
  font-size: 12.5px;
  font-weight: 600;
  color: #1f2937;
  flex-shrink: 0;
}
.chat-mention-item-role {
  font-size: 11px;
  color: #9aa3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-composer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #eef1f5;
  background: #fff;
  flex-shrink: 0;
}
.chat-composer-input {
  flex: 1;
  border: 1px solid #e5e9ef;
  background: #f7f9fb;
  border-radius: 999px;
  padding: 9px 16px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease, background 0.15s ease;
  min-width: 0;
}
.chat-composer-input:focus {
  border-color: #1874a5;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(24, 116, 165, 0.12);
}
.chat-composer-input:disabled {
  opacity: 0.6;
}
.chat-send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: #1874a5;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, transform 0.1s ease;
}
.chat-send-btn:hover:not(:disabled) {
  background: #145f87;
  transform: scale(1.05);
}
.chat-send-btn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}
</style>
