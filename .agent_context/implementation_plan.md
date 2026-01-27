# Long-Term Audit Plan (Refined)
## QR Thermal Label App

---

## ✅ Requirements Confirmed

| Aspect | Requirement |
|--------|-------------|
| **Platform** | Desktop primary, Mobile support required |
| **Offline** | View/Print cached OK offline, Add Customer requires online (show indicator) |
| **Scale** | ~1000 customers per branch |
| **Security** | Internal only, password auth per branch, unpublished domain |
| **GuestBook** | Low priority - experimental, exhibition use only |

---

## 🎯 Prioritized Roadmap

### Phase 1: Critical & Quick Wins ⚡
*Target: 2-3 hours*

- [x] **Move API URL to `.env`** - Security best practice
- [x] **Add Online/Offline indicator** - Show status in header
- [x] **Block Add Customer when offline** - With clear message
- [x] **Session expiry** - Auto-logout after 7 days idle
- [x] **Fix all toast dismissal issues** - Consistent UX

---

### Phase 2: Performance & Scale 📈
*Target: 3-4 hours*

- [x] **Virtualization everywhere** - ~1000 items need windowing
  - CustomerSearch ✅ (already done)
  - GuestBook attendance list (if needed later)
  - Batch Generator preview table
- [x] **Memoize list items** - `React.memo` on card components
- [x] **Lazy load heavy components** - AdminPanel, GuestBook, BatchModal
- [x] **Local QR Generation** - Remove external API dependency

---

### Phase 3: UI/UX Polish 🎨
*Target: 2-3 hours*

- [ ] **Responsive refinements**
  - Touch-friendly button sizes (min 44px)
  - Mobile keyboard handling (input not hidden)
  - Proper viewport meta
- [ ] **Consistent modal behavior**
  - Close on backdrop click
  - Escape key to close
  - Focus trap for accessibility
- [ ] **Loading states everywhere**
  - Skeleton loaders in modals
  - Disabled buttons during async
- [ ] **Desktop enhancements**
  - Keyboard shortcuts (Ctrl+P for print, Esc to close)
  - Hover states on cards

---

### Phase 4: Architecture Cleanup 🏗️
*Target: 4-5 hours (can be deferred)*

- [ ] **Create CustomerContext** - Global state for customer data
- [ ] **Extract large components**
  - GuestBook → smaller subcomponents (only if actively used)
  - AdminPanel → tabs as separate components
- [ ] **Consolidate CSS** - Create design tokens file
- [ ] **Add PropTypes** - Runtime type safety

---

### Phase 5: Testing & Docs 📚
*Target: 2-3 hours (optional)*

- [ ] **Unit tests** - labelLayout.js, qrParser.js
- [ ] **Integration tests** - Auth flow, Add Customer
- [ ] **README update** - Setup, deployment, architecture
- [ ] **Inline documentation** - JSDoc on key functions

---

## 🚨 Issues by Priority

### HIGH (Do First)
1. Hardcoded API URL in `googleSheets.js`
2. No offline indicator - user doesn't know when actions will fail
3. Session never expires

### MEDIUM (Do Soon)
4. Batch modal table not virtualized (slow with many items)
5. QR from external API (network dependency)
6. No memoization on list items

### LOW (Nice to Have)
7. GuestBook component too large (but low priority feature)
8. Multiple CSS files with redundancy
9. No TypeScript

---

## 📊 Estimated Total Effort

| Phase | Hours | Priority |
|-------|-------|----------|
| Phase 1: Critical | 2-3h | 🔴 High |
| Phase 2: Performance | 3-4h | 🟠 Medium |
| Phase 3: UX Polish | 2-3h | 🟡 Medium |
| Phase 4: Architecture | 4-5h | 🟢 Low |
| Phase 5: Testing | 2-3h | ⚪ Optional |
| **Total** | **13-18h** | |

---

## 🚀 Immediate Next Steps (Print & Logic Unification)

### 1. Unify Print Logic
- [ ] **Refactor `PrintPreview.jsx`**
  - Remove `escPosEncoder` dependency.
  - Implement `renderLabelToCanvas` + `canvasToRaster` (same as Batch).
  - Add "Print Config" controls (Width/Height/Gap) to Single Print UI.

### 2. Fix Alignment & Margins
- [ ] **Refactor `printHelpers.js`**
  - Add explicit margin support (padding) to `renderLabelToCanvas` to prevent content from touching the edge (which causes the cutoff).
  - Ensure `0x0C` (Form Feed) is consistently applied.

---

## 🚀 Immediate Next Steps

I am currently working on **Phase 3: UI/UX Polish**:
1. Responsive refinements (Touch & Keyboard)
2. Consistent modal behavior (Backdrop close)
3. Loading states everywhere
4. Desktop enhancements (Shortcuts)
