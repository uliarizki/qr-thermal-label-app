# Thermal Label Refinement Walkthrough

**Live Production**: [https://qr-thermal-label-appn.vercel.app](https://qr-thermal-label-appn.vercel.app)

This document summarizes the changes made to the Thermal Label layout and preview functionality.

## Changes Verified

- **Dynamic Font Scaling**: Customer names now automatically resize (from 11pt down to 9pt or 10pt) based on length and word size to prevent improper wrapping.
- **Layout Synchronization**: The `PrintPreview` component's CSS now matches the `jsPDF` generation logic almost pixel-perfectly.
    - Padding: 1mm
    - Gap: 1mm
    - Top Alignment: Optimized to start content at the very top edge.
- **Visual Hierarchy**:
    - **Separator Line**: Removed as requested.
    - **City**: Now uses **Smart Layout** logic (same as Name). It will wrap to a second line if too long, instead of being cut off. Font starts at 9pt and can shrink to 8pt if needed.
    - **Branch/Wholesaler**: Positioned to align vertically with the Customer ID row (Right Aligned), ensuring a balanced footer layout.

## Phase 2: Performance & Scale Audit
- **Virtualization**: Implemented `react-window` for Batch Generator table, allowing smooth rendering of 1000+ items.
- **Lazy Loading**: `AdminPanel`, `GuestBook`, and `BatchGeneratorModal` now load only when needed, reducing initial bundle size.
- **Memoization**: Created `CustomerCard` with `React.memo` to prevent unnecessary re-renders in the main list.
- **Offline QR**: Replaced external API with local `qrcode` and `react-qr-code` libraries. App is now fully offline-capable for generating and printing labels.

## Verification


The following files were modified and verified to produce consistent results between the on-screen preview and the generated PDF:

- `src/utils/pdfGeneratorVector.js`
- `src/components/PrintPreview.jsx`

The PDF output should now:
1. Be aligned tightly to the top-left (1mm padding).
2. Have no horizontal separator line.
3. Show the customer name dynamically sized.

## New Feature: Batch ID Generator
- **Batch Tools**: Accessible via valid list/grid view header.
- **Bulk Input**: Paste CSV-style data (Name, City, Branch).
- **Smart Matching**: Detects existing customers by Name + Branch.
- **Zip Download**: Generates PDFs for all entries (Existing & New) in a single ZIP file. New customers use their name/branch without a formal database ID if not registered.
