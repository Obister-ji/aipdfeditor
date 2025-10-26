<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI PDF Editor Pro

A powerful, AI-enhanced PDF editing tool that allows you to modify, annotate, and enhance PDF documents with advanced features.

**Hi Ryuk!** 👋

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/10GbcRhhipY0Rv08mETeeQeoaRviOMP_R

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## 🚀 Features

- **PDF Viewing & Navigation**: Multi-page PDF viewing with zoom controls and responsive design
- **Text Editing**: Edit existing PDF text, add new text with customizable formatting
- **Annotation Tools**: Freehand drawing, shapes, image insertion with layering controls
- **AI Integration**: Document summarization using Google Gemini API
- **Advanced Features**: Undo/redo functionality, layer management, export capabilities

## 📝 Recent Updates & Fixes

### Key Improvements

#### 🔧 Rectangle Tool Fix
- **Issue**: Rectangle shapes were not rendering properly with correct dimensions
- **Fix**: Improved rectangle drawing logic with proper coordinate calculation and size validation
- **Enhancement**: Added minimum size requirement (5px) to prevent accidental tiny shapes

#### 🖼️ Image Layer Management Fix
- **Issue**: Images were not properly layering behind or in front of text elements
- **Fix**: Implemented proper z-index management system with dedicated controls
- **Enhancement**: Added intuitive "Bring to Front" and "Send to Back" controls in image toolbar

#### ✏️ Drawing Tool Enhancement
- **Issue**: Pencil/drawing tool had performance issues and rendering artifacts
- **Fix**: Optimized drawing path calculation and SVG rendering
- **Enhancement**: Smoother drawing experience with improved point tracking

#### 📝 Text Editing Improvements
- **Issue**: Original text positioning and editing had precision problems
- **Fix**: Enhanced text coordinate transformation and positioning accuracy
- **Enhancement**: Better whiteout coverage for moved/deleted text elements

#### 🎯 Object Selection & Interaction
- **Issue**: Object selection was inconsistent across different element types
- **Fix**: Unified selection system for all object types (text, images, shapes, drawings)
- **Enhancement**: Improved visual feedback with better selection indicators

#### 💾 Save & Export Stability
- **Issue**: PDF export had formatting inconsistencies with modified content
- **Fix**: Enhanced PDF generation with proper font embedding and coordinate mapping
- **Enhancement**: More reliable export process with better error handling

#### 🎨 UI/UX Enhancements
- **Issue**: Toolbar positioning and responsiveness needed improvement
- **Fix**: Better boundary checking and positioning logic for floating toolbars
- **Enhancement**: Improved mobile responsiveness and touch interaction

### Technical Improvements

- **Performance**: Optimized rendering pipeline for better performance with large documents
- **Memory Management**: Improved object lifecycle management and memory cleanup
- **Type Safety**: Enhanced TypeScript definitions for better development experience
- **Error Handling**: More robust error handling throughout the application

## 📸 Screenshots

   Preview images are available in the project's `public/` folder and are served from the app root when running locally. Below are the screenshots included with this repo:

   - Desktop view
      <img width="1200" height="475" alt="GHBanner" src="/public/AI PDF Editor Pro - Google Chrome 24-10-2025 10_35_44.png" />
</div>

   - Editor in action
      <img width="1200" height="475" alt="GHBanner" src="/public/AI PDF Editor Pro - Google Chrome 24-10-2025 10_36_56.png">
</div>