# Thermal Label Refinement

- [ ] Create Implementation Plan <!-- id: 0 -->
- [x] Update `pdfGeneratorVector.js` layout <!-- id: 1 -->
    - [x] Improve Name word-wrapping (avoid mid-word breaks if possible) <!-- id: 1a -->
    - [x] Distinguish City font (Bold, 9pt) <!-- id: 1b -->
    - [x] Adjust separator line (removed as requested) <!-- id: 1c -->
    - [x] Add spacing between sections <!-- id: 1d -->
- [x] Update `PrintPreview.jsx` to match PDF layout <!-- id: 2 -->
- [x] Verify changes with user <!-- id: 3 -->
- [x] Unify Label Layout Logic <!-- id: 5 -->
    - [x] Create `src/utils/labelLayout.js` <!-- id: 5a -->
    - [x] Refactor `pdfGeneratorVector.js` to use `labelLayout.js` <!-- id: 5b -->
    - [x] Refactor `PrintPreview.jsx` to use `labelLayout.js` <!-- id: 5c -->
    - [x] Verify synchronization <!-- id: 5d -->

# Batch ID Card Generation
- [x] Research & Plan ID Generation Strategy <!-- id: 6 -->
- [x] Implement Batch Input UI (CSV/Paste) <!-- id: 7 -->
- [x] Implement Customer Matching/Creation Logic <!-- id: 8 -->
- [x] Implement Batch PDF/Image Generator (ZIP download) <!-- id: 9 -->

# Layout Refinement
- [x] Reposition Branch (align with ID row) <!-- id: 10 -->

# Phase 1: Critical Fixes (Audit)
- [x] Move API URL to `.env` <!-- id: 11 -->
- [x] Add Online/Offline indicator in header <!-- id: 12 -->
- [x] Block Add Customer when offline <!-- id: 13 -->
- [x] Session expiry (7 days) <!-- id: 14 -->

# Phase 2: Performance & Scale
- [x] Virtualize Batch Modal table <!-- id: 15 -->
- [x] Memoize list items <!-- id: 16 -->
- [x] Lazy load AdminPanel & GuestBook <!-- id: 17 -->
- [x] Local QR Generation (remove API dep) <!-- id: 18 -->

# Phase 3: UI/UX Polish
- [ ] Responsive refinements (Touch & Keyboard) <!-- id: 19 -->
- [ ] Consistent modal behavior (Backdrop close) <!-- id: 20 -->
- [ ] Loading states everywhere <!-- id: 21 -->
- [ ] Desktop enhancements (Shortcuts) <!-- id: 22 -->
