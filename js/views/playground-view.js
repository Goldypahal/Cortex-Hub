/**
 * AURA AI Platform
 * Live AI Sandbox & Grounded Citation Verification View Controller
 * Tactical IDE Split-Pane Layout
 */

import { DEMO_SCENARIOS } from "../data/demo-scenarios.js";
import { getIconSvg, copyToClipboard, showToast } from "../utils/helpers.js";

export class PlaygroundView {
  constructor(app) {
    this.app = app;
    this.scenarios = DEMO_SCENARIOS;
    this.activeScenario = this.scenarios[0];
    this.selectedModel = "Claude 3.5 Sonnet";
    this.selectedRetrieval = "Hybrid (pgvector + BM25)";
    this.topK = 4;
    this.temperature = 0.2;
    this.isStreaming = false;
  }

  render(container) {
    container.innerHTML = `
      <div class="playground-container">
        <!-- Header -->
        <div class="playground-header">
          <div class="playground-title-area">
            <h2>Live AI Sandbox &amp; Grounding Bench</h2>
            <p>Directly test vector retrieval accuracy, exact byte-offset citations, and inference cost telemetry.</p>
          </div>
          <!-- Engineering Stages -->
          <div class="sandbox-stepper">
            <div class="stepper-node active">
              <span class="stepper-num">01</span>
              <span>DATA INGEST</span>
            </div>
            <div class="stepper-node active">
              <span class="stepper-num">02</span>
              <span>MODEL &amp; ROUTE</span>
            </div>
            <div class="stepper-node active">
              <span class="stepper-num">03</span>
              <span>GROUNDED CITATIONS</span>
            </div>
          </div>
        </div>

        <!-- Split IDE Workspace -->
        <div class="playground-workspace">
          <!-- Left Controls -->
          <div class="playground-controls-panel">
            <!-- Dropzone -->
            <div class="card">
              <span class="form-label" style="margin-bottom: 6px;">[01] INGEST KNOWLEDGE BASE</span>
              <div class="dropzone" id="playground-dropzone">
                <div class="dropzone-icon">// DROP FILE</div>
                <div class="dropzone-text">Click or Drag PDF / DOCX</div>
                <div class="dropzone-subtext">Max 10MB • Ephemeral memory auto-purged on session end</div>
                <input type="file" id="playground-file-input" style="display: none;" accept=".pdf,.docx,.txt" />
              </div>

              <div id="upload-status-pill" style="display: none; margin-top: 10px; padding: 6px 10px; background: var(--accent-lime-dim); border: 1px solid var(--accent-lime-border); border-radius: var(--radius-xs); font-family: var(--font-mono); font-size: 0.74rem; color: var(--accent-lime); align-items: center; gap: 6px;">
                <span>●</span>
                <span id="upload-status-text">Parsed into 48 dense embeddings</span>
              </div>
            </div>

            <!-- Scenarios -->
            <div class="card">
              <span class="form-label" style="margin-bottom: 6px;">[02] PRE-LOADED TEST SCENARIOS</span>
              <div class="scenarios-grid">
                ${this.scenarios
                  .map(
                    (s) => `
                  <div class="scenario-chip ${s.id === this.activeScenario.id ? "active" : ""}" data-id="${s.id}">
                    <div class="scenario-info">
                      <span class="scenario-title">${s.title}</span>
                      <span class="scenario-meta">${s.industry} • ${s.pages} pgs (${s.filesize})</span>
                    </div>
                    <span style="font-family: var(--font-mono); font-size: 0.8rem; color: ${s.id === this.activeScenario.id ? "var(--accent-lime)" : "var(--text-muted)"}">
                      →
                    </span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>

            <!-- Settings -->
            <div class="card">
              <span class="form-label" style="margin-bottom: 8px;">[03] INFERENCE CONFIG</span>
              
              <div class="form-group">
                <label class="form-label">LLM Runtime Provider</label>
                <select id="model-select" class="select-input" style="font-family: var(--font-mono); font-size: 0.78rem;">
                  <option value="Claude 3.5 Sonnet" selected>Claude 3.5 Sonnet (Anthropic)</option>
                  <option value="GPT-4o">GPT-4o (OpenAI)</option>
                  <option value="Gemini 1.5 Pro">Gemini 1.5 Pro (Google)</option>
                  <option value="Llama 3.3 70B">Llama 3.3 70B (Air-Gapped Sovereign)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Retrieval Engine</label>
                <select id="retrieval-select" class="select-input" style="font-family: var(--font-mono); font-size: 0.78rem;">
                  <option value="Hybrid (pgvector + BM25)" selected>Hybrid (pgvector HNSW + BM25 Lexical)</option>
                  <option value="Dense Vector (HNSW)">Dense Vector (HNSW Cosine)</option>
                  <option value="Sparse BM25">Sparse BM25 Keyword Only</option>
                </select>
              </div>

              <div class="form-group">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="form-label" style="margin-bottom: 0;">Top-K Chunks</label>
                  <span id="topk-val" style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime); font-weight: 700;">4</span>
                </div>
                <input type="range" id="topk-slider" class="slider-input" min="1" max="8" value="4" />
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="form-label" style="margin-bottom: 0;">Temperature</label>
                  <span id="temp-val" style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime); font-weight: 700;">0.2</span>
                </div>
                <input type="range" id="temp-slider" class="slider-input" min="0" max="1" step="0.1" value="0.2" />
              </div>
            </div>
          </div>

          <!-- Right Chat & Citations -->
          <div class="playground-chat-panel">
            <div class="chat-panel-topbar">
              <div class="active-doc-badge">
                <span>[DOC]</span>
                <span id="active-doc-title">${this.activeScenario.filename}</span>
              </div>
              <div style="display: flex; gap: 6px;">
                <button class="btn btn-outline btn-sm" id="btn-export-code">
                  SDK Code
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-clear-chat">
                  Reset Session
                </button>
              </div>
            </div>

            <!-- Feed -->
            <div class="chat-feed" id="chat-feed">
              <div class="chat-bubble assistant">
                <div class="chat-avatar assistant">AI</div>
                <div class="chat-content">
                  Session initialized with <strong>${this.activeScenario.filename}</strong> in ephemeral isolated memory.
                  Submit a query below or select a benchmark prompt to inspect verified page-level source citations.
                </div>
              </div>
            </div>

            <!-- Input Bar -->
            <div class="chat-input-container">
              <div class="suggested-prompts" id="suggested-prompts">
                ${this.activeScenario.sampleQuestions
                  .map((q) => `<span class="prompt-pill" data-prompt="${q}">// ${q}</span>`)
                  .join("")}
              </div>

              <form class="chat-input-form" id="chat-form">
                <input
                  type="text"
                  id="chat-query-input"
                  class="chat-input-field"
                  placeholder="Enter query to inspect grounded citations..."
                  value="${this.activeScenario.defaultQuestion}"
                  autocomplete="off"
                />
                <button type="submit" class="btn btn-primary" id="btn-send-chat" style="padding: 0 16px;">
                  Verify →
                </button>
              </form>
            </div>

            <!-- Monospaced Telemetry Bar -->
            <div class="telemetry-strip" id="telemetry-strip">
              <div class="telemetry-metrics">
                <div class="telemetry-metric">
                  <span>LATENCY:</span>
                  <span class="metric-value" id="telem-latency">${this.activeScenario.simulatedResponse.telemetry.latencyMs}ms</span>
                </div>
                <div class="telemetry-metric">
                  <span>PROMPT:</span>
                  <span class="metric-value" id="telem-prompt">${this.activeScenario.simulatedResponse.telemetry.tokensPrompt} tok</span>
                </div>
                <div class="telemetry-metric">
                  <span>COMPLETION:</span>
                  <span class="metric-value" id="telem-completion">${this.activeScenario.simulatedResponse.telemetry.tokensCompletion} tok</span>
                </div>
                <div class="telemetry-metric">
                  <span>INFERENCE:</span>
                  <span class="metric-value" id="telem-cost">$${this.activeScenario.simulatedResponse.telemetry.costUsd} (₹${this.activeScenario.simulatedResponse.telemetry.costInr})</span>
                </div>
              </div>
              <div style="font-family: var(--font-mono); color: var(--text-muted); font-size: 0.7rem;">
                <span id="telem-model">${this.activeScenario.simulatedResponse.telemetry.model}</span> // <span id="telem-retrieval">${this.activeScenario.simulatedResponse.telemetry.retrievalMethod}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  }

  attachEvents(container) {
    const chips = container.querySelectorAll(".scenario-chip");
    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.classList.remove("active"));
        chip.classList.add("active");
        const found = this.scenarios.find((s) => s.id === chip.dataset.id);
        if (found) {
          this.activeScenario = found;
          this.updateActiveScenarioUI(container);
        }
      });
    });

    const dropzone = container.querySelector("#playground-dropzone");
    const fileInput = container.querySelector("#playground-file-input");
    const uploadPill = container.querySelector("#upload-status-pill");
    const uploadText = container.querySelector("#upload-status-text");

    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("dragover");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.simulateFileUpload(e.dataTransfer.files[0].name, uploadPill, uploadText);
      }
    });
    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        this.simulateFileUpload(e.target.files[0].name, uploadPill, uploadText);
      }
    });

    container.querySelector("#model-select").addEventListener("change", (e) => {
      this.selectedModel = e.target.value;
      container.querySelector("#telem-model").textContent = this.selectedModel;
      showToast(`Runtime engine: ${this.selectedModel}`, "info");
    });

    container.querySelector("#retrieval-select").addEventListener("change", (e) => {
      this.selectedRetrieval = e.target.value;
      container.querySelector("#telem-retrieval").textContent = this.selectedRetrieval;
    });

    const topkSlider = container.querySelector("#topk-slider");
    const topkVal = container.querySelector("#topk-val");
    topkSlider.addEventListener("input", (e) => {
      topkVal.textContent = e.target.value;
      this.topK = parseInt(e.target.value);
    });

    const tempSlider = container.querySelector("#temp-slider");
    const tempVal = container.querySelector("#temp-val");
    tempSlider.addEventListener("input", (e) => {
      tempVal.textContent = e.target.value;
      this.temperature = parseFloat(e.target.value);
    });

    this.bindPromptPills(container);

    const chatForm = container.querySelector("#chat-form");
    chatForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = container.querySelector("#chat-query-input");
      const query = input.value.trim();
      if (!query || this.isStreaming) return;
      this.submitQuery(query, container);
    });

    container.querySelector("#btn-clear-chat").addEventListener("click", () => {
      const feed = container.querySelector("#chat-feed");
      feed.innerHTML = `
        <div class="chat-bubble assistant">
          <div class="chat-avatar assistant">AI</div>
          <div class="chat-content">
            Ephemeral buffer purged per compliance spec. Ready for next query.
          </div>
        </div>
      `;
      showToast("Playground session reset", "info");
    });

    container.querySelector("#btn-export-code").addEventListener("click", () => {
      this.showCodeExportModal();
    });
  }

  bindPromptPills(container) {
    const pills = container.querySelectorAll(".prompt-pill");
    pills.forEach((p) => {
      p.addEventListener("click", () => {
        const promptText = p.dataset.prompt;
        const input = container.querySelector("#chat-query-input");
        input.value = promptText;
        this.submitQuery(promptText, container);
      });
    });
  }

  updateActiveScenarioUI(container) {
    container.querySelector("#active-doc-title").textContent = this.activeScenario.filename;
    container.querySelector("#chat-query-input").value = this.activeScenario.defaultQuestion;

    const promptsDiv = container.querySelector("#suggested-prompts");
    promptsDiv.innerHTML = this.activeScenario.sampleQuestions
      .map((q) => `<span class="prompt-pill" data-prompt="${q}">// ${q}</span>`)
      .join("");
    this.bindPromptPills(container);

    const feed = container.querySelector("#chat-feed");
    feed.innerHTML = `
      <div class="chat-bubble assistant">
        <div class="chat-avatar assistant">AI</div>
        <div class="chat-content">
          Loaded pre-indexed scenario: <strong>${this.activeScenario.title}</strong> (${this.activeScenario.pages} pages).
          Ready to verify grounded citations and calculate telemetry.
        </div>
      </div>
    `;

    const t = this.activeScenario.simulatedResponse.telemetry;
    container.querySelector("#telem-latency").textContent = `${t.latencyMs}ms`;
    container.querySelector("#telem-prompt").textContent = `${t.tokensPrompt} tok`;
    container.querySelector("#telem-completion").textContent = `${t.tokensCompletion} tok`;
    container.querySelector("#telem-cost").textContent = `$${t.costUsd} (₹${t.costInr})`;
  }

  simulateFileUpload(filename, pill, textSpan) {
    pill.style.display = "flex";
    textSpan.innerHTML = `[CHUNKING] Generating HNSW vectors for <strong>${filename}</strong>...`;

    setTimeout(() => {
      textSpan.innerHTML = `[INDEXED] <strong>${filename}</strong> (36 chunks, 1,536-dim HNSW embeddings)`;
      showToast(`Document "${filename}" vectorized successfully!`, "success");
      document.querySelector("#active-doc-title").textContent = filename;
    }, 1100);
  }

  submitQuery(query, container) {
    const feed = container.querySelector("#chat-feed");
    const sendBtn = container.querySelector("#btn-send-chat");
    const input = container.querySelector("#chat-query-input");

    const userMsg = document.createElement("div");
    userMsg.className = "chat-bubble user";
    userMsg.innerHTML = `
      <div class="chat-avatar user">USR</div>
      <div class="chat-content">${query}</div>
    `;
    feed.appendChild(userMsg);
    input.value = "";
    feed.scrollTop = feed.scrollHeight;

    this.isStreaming = true;
    sendBtn.disabled = true;

    const assistantMsg = document.createElement("div");
    assistantMsg.className = "chat-bubble assistant";
    assistantMsg.innerHTML = `
      <div class="chat-avatar assistant">AI</div>
      <div class="chat-content">
        <span style="font-family: var(--font-mono); color: var(--accent-lime); font-size: 0.8rem;">
          [QUERYING ${this.selectedRetrieval.toUpperCase()}] Retrieving candidate vectors...
        </span>
      </div>
    `;
    feed.appendChild(assistantMsg);
    feed.scrollTop = feed.scrollHeight;

    const latencyBase = this.activeScenario.simulatedResponse.telemetry.latencyMs;
    const actualLatency = Math.round(latencyBase + (Math.random() * 100 - 50));

    setTimeout(() => {
      const responseData = this.activeScenario.simulatedResponse;
      const contentBox = assistantMsg.querySelector(".chat-content");

      contentBox.innerHTML = `
        <div style="margin-bottom: 12px;">${responseData.answer}</div>
        
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-medium);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-family: var(--font-mono); font-size: 0.72rem; font-weight: 700; color: var(--accent-lime); letter-spacing: 0.05em;">
              // VERIFIED GROUNDED CITATIONS (${responseData.citations.length})
            </span>
            <span style="font-family: var(--font-mono); font-size: 0.7rem; color: var(--text-muted);">CONFIDENCE: 99.4%</span>
          </div>

          ${responseData.citations
            .map(
              (c) => `
            <div class="citation-box">
              <div class="citation-header">
                <span>PAGE ${c.pageNo} // ${c.section}</span>
                <span>MATCH: ${c.confidence}%</span>
              </div>
              <div class="citation-excerpt">
                "${c.excerpt}"
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      container.querySelector("#telem-latency").textContent = `${actualLatency}ms`;
      container.querySelector("#telem-cost").textContent = `$${responseData.telemetry.costUsd} (₹${responseData.telemetry.costInr})`;

      this.isStreaming = false;
      sendBtn.disabled = false;
      feed.scrollTop = feed.scrollHeight;
    }, actualLatency);
  }

  showCodeExportModal() {
    let modal = document.getElementById("code-export-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "code-export-modal";
      modal.className = "modal-backdrop";
      document.body.appendChild(modal);
    }

    const pythonCode = `import requests

API_URL = "https://api.aicomponents.io/v1/rag/query"
HEADERS = {
    "Authorization": "Bearer sk-live-YOUR-API-KEY",
    "Content-Type": "application/json"
}

payload = {
    "document_id": "${this.activeScenario.id}",
    "model": "${this.selectedModel}",
    "retrieval_strategy": "${this.selectedRetrieval}",
    "top_k": ${this.topK},
    "temperature": ${this.temperature},
    "prompt": "${this.activeScenario.defaultQuestion}"
}

response = requests.post(API_URL, headers=HEADERS, json=payload)
data = response.json()

print("Deterministic Response:", data["answer"])
for cite in data["citations"]:
    print(f"-> [P.{cite['page_no']} - {cite['section']}]: {cite['excerpt']}")`;

    modal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <div>
            <h3 class="modal-title">Live API Integration Manifest</h3>
            <p style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
              // Programmatic reproduction of current active parameters
            </p>
          </div>
          <button class="btn-icon btn-ghost modal-close-btn">${getIconSvg("x", 20)}</button>
        </div>
        <div class="modal-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-family: var(--font-mono); font-size: 0.76rem; color: var(--accent-lime);">python-requests v1.0</span>
            <button class="btn btn-outline btn-sm" id="btn-copy-sdk-code">Copy Manifest</button>
          </div>
          <pre style="background: var(--bg-deep); border: 1px solid var(--border-medium); padding: 12px; border-radius: var(--radius-xs); font-family: var(--font-mono); font-size: 0.76rem; color: #E2E8F0; overflow-x: auto; line-height: 1.5;">${pythonCode}</pre>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary modal-close-btn">Done</button>
        </div>
      </div>
    `;

    modal.classList.add("active");
    modal.querySelectorAll(".modal-close-btn").forEach((btn) => {
      btn.addEventListener("click", () => modal.classList.remove("active"));
    });

    modal.querySelector("#btn-copy-sdk-code").addEventListener("click", () => {
      copyToClipboard(pythonCode, "API integration snippet copied!");
    });
  }
}
