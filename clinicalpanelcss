/* clinicalCulturalPanel.css
   Uses the SAME CSS variables already defined in your style.css
   (--bg, --surface, --line, --text, --muted, --synapse, --clinical, --mono, --sans)
   so this panel matches your existing look with zero extra variables. */

.ccp-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: min(380px, 100vw);
  height: 100vh;
  background: var(--surface);
  border-left: 1px solid var(--line);
  color: var(--text);
  font-family: var(--sans);
  z-index: 30; /* above info-panel (which has no explicit z-index) and quiz-bar (14) */
  display: flex;
  flex-direction: column;
  transform: translateX(0);
  transition: transform 0.25s ease;
  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.35);
}

.ccp-panel.ccp-hidden {
  transform: translateX(100%);
  pointer-events: none;
}

.ccp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
}

.ccp-title {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.ccp-close {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}
.ccp-close:hover { background: var(--surface-2); color: var(--text); }

.ccp-tabs {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
}

.ccp-tab {
  flex: 1;
  background: var(--surface-2);
  border: 1px solid var(--line);
  color: var(--muted);
  font-family: var(--mono);
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.ccp-tab:hover { border-color: var(--synapse); }

.ccp-tab-active {
  background: rgba(71, 224, 176, 0.12);
  color: var(--synapse);
  border-color: var(--synapse);
  font-weight: 600;
}

.ccp-body {
  overflow-y: auto;
  padding: 16px 18px 32px;
  flex: 1;
}
.ccp-body::-webkit-scrollbar { width: 6px; }
.ccp-body::-webkit-scrollbar-thumb { background: var(--line); border-radius: 3px; }

.ccp-empty {
  color: var(--muted);
  font-size: 13.5px;
}

.ccp-disorder {
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 14px;
}

.ccp-disorder h4 {
  margin: 0 0 8px;
  font-family: var(--mono);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.ccp-code-row {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.ccp-badge {
  font-family: var(--mono);
  font-size: 10.5px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}
.ccp-badge-dsm { background: rgba(71, 224, 176, 0.12); color: var(--synapse); }
.ccp-badge-icd { background: rgba(232, 162, 61, 0.14); color: var(--clinical); }

.ccp-label {
  font-family: var(--mono);
  font-size: 10.5px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--muted);
  margin: 10px 0 3px;
}

.ccp-disorder p {
  font-size: 13px;
  line-height: 1.55;
  margin: 0;
  color: var(--text);
}

.ccp-evidence {
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--muted);
  font-style: italic;
}

.ccp-region-list {
  margin: 4px 0 0;
  padding-left: 18px;
  font-size: 13px;
  line-height: 1.55;
}

.ccp-caveat {
  margin-top: 10px;
  font-size: 11.5px;
  color: var(--clinical);
  line-height: 1.5;
}

@media (max-width: 480px) {
  .ccp-panel { width: 100vw; }
}
