import { emitEvent } from "../configs/socket.mjs";
import { AnnouncementStyles } from "./announcement_styles.mjs";

export class Announcement {
  
  constructor(announcement, timer=5000, options={}) {
    const duration = Number(timer);

    this.announcement = announcement ?? "";
    this.timer = Number.isFinite(duration) ? Math.max(duration, 0) : 5000;
    this.style = AnnouncementStyles.setFormat().has(options.style) ? options.style : "banner";
    this.element = null;
    this.timeout = null;
    this.closing = false;
    this._onKeyDown = this._onKeyDown.bind(this);
  }

  announce() {
    if (!this.announcement) return;

    this.element = this._createElement();
    document.body.appendChild(this.element);
    document.addEventListener("keydown", this._onKeyDown, true);
    this.timeout = window.setTimeout(() => this.close(), this.timer);
  }

  close() {
    if (this.closing || !this.element) return;

    this.closing = true;
    window.clearTimeout(this.timeout);
    document.removeEventListener("keydown", this._onKeyDown, true);
    this.element.classList.add("pde-announcement-closing");
    window.setTimeout(() => {
      this.element?.remove();
      this.element = null;
    }, 450);
  }

  _onKeyDown(event) {
    if (event.key !== "Escape") return;

    event.preventDefault();
    event.stopPropagation();
    this.close();
  }

  _createElement() {
    const overlay = document.createElement("div");
    overlay.className = `pde-announcement-overlay pde-announcement-${this._styleClassName()}`;

    const content = document.createElement("div");
    content.className = "pde-announcement-content";

    const text = document.createElement("span");
    text.className = "pde-announcement-text";
    text.textContent = this.announcement;

    const hint = document.createElement("div");
    hint.className = "pde-announcement-hint";
    hint.textContent = game.i18n.localize("PDE.ESC_TO_CLOSE");

    content.append(text);
    overlay.append(content, hint);
    return overlay;
  }

  _styleClassName() {
    return String(this.style).replaceAll("_", "-");
  }
}

export function announceAll(announcement, timer, options={}) {
  emitEvent(PDE.CONST.SOCKET.EMIT.ANNOUNCEMENT, {announcement: announcement, timer: timer, options: options});
  announce(announcement, timer, options);
}

export function announce(announcement, timer, options={}) {
  new Announcement(announcement, timer, options).announce();
}
