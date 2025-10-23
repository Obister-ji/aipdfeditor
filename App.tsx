import React, { useState, useEffect, useCallback } from 'react';
import type { EditorObject, Tool, OriginalTextObject } from './types';
import FileUpload from './components/FileUpload';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import PdfViewer from './components/PdfViewer';
import { summarizePdfText } from './services/geminiService';
import { SpinnerIcon } from './components/icons/SpinnerIcon';
import { SaveIcon } from './components/icons/SaveIcon';


// Minimal TypeScript declarations for CDN libraries
declare const pdfjsLib: any;
declare const PDFLib: any;

interface HistoryState {
    editorObjects: { [page: number]: EditorObject[] };
    originalText: { [page: number]: OriginalTextObject[] };
}

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any | null>(null); // PDF-LIB document
  const [pdfPages, setPdfPages] = useState<any[]>([]); // PDF.js pages
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryState[]>([{ editorObjects: {}, originalText: {} }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const { editorObjects, originalText } = history[historyIndex];
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const [zoom, setZoom] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    // On initial load, close the sidebar if the screen is small
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);
  
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  const handleZoom = useCallback((value: number | 'in' | 'out') => {
    setZoom(prevZoom => {
      let newZoom;
      if (value === 'in') {
        newZoom = prevZoom + 0.2;
      } else if (value === 'out') {
        newZoom = prevZoom - 0.2;
      } else {
        newZoom = value;
      }
      return Math.max(0.5, Math.min(newZoom, 3.0));
    });
  }, []);
  
  const handleFileChange = async (selectedFile: File) => {
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setIsLoading(true);
      setFile(selectedFile);
      setHistory([ { editorObjects: {}, originalText: {} } ]);
      setHistoryIndex(0);
      setCurrentPage(1);
      setSelectedObjectId(null);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        
        // Load with PDF-LIB for editing
        const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);
        setPdfDoc(pdfDoc);

        // Load with PDF.js for rendering and text extraction
        const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const pages = [];
        const originalTextPerPage: { [page: number]: OriginalTextObject[] } = {};

        for (let i = 1; i <= pdfJsDoc.numPages; i++) {
          const page = await pdfJsDoc.getPage(i);
          pages.push(page);
          
          const textContent = await page.getTextContent();
          
          const createLineFromItems = (items: any[], pageNum: number): OriginalTextObject => {
              const firstItem = items[0];
              const lastItem = items[items.length - 1];
              const text = items.map(it => it.str).join(' ');
              const styles = textContent.styles[firstItem.fontName];
              const fontWeight = (styles?.fontWeight >= 700 || /bold/i.test(styles?.fontFamily)) ? 700 : 400;
              const fontStyle = (styles?.italic || /italic|oblique/i.test(styles?.fontFamily)) ? 'italic' : 'normal';
              const fontFamily = styles?.fontFamily || 'Helvetica';
              const transform = firstItem.transform;
              const fontSize = Math.sqrt(Math.pow(transform[0], 2) + Math.pow(transform[1], 2));
              const width = (lastItem.transform[4] + lastItem.width) - firstItem.transform[4];
              const height = Math.max(...items.map(it => it.height));
              return {
                  id: crypto.randomUUID(),
                  page: pageNum,
                  text: text,
                  width: width,
                  height: height,
                  transform: transform,
                  fontName: firstItem.fontName,
                  fontSize: fontSize,
                  fontWeight: fontWeight,
                  fontStyle: fontStyle,
                  color: '#000000',
                  fontFamily: fontFamily,
              };
          };

          const items = textContent.items
              .filter((item: any) => item.str.trim() !== '')
              .sort((a: any, b: any) => {
                  if (Math.abs(a.transform[5] - b.transform[5]) > 1) {
                      return b.transform[5] - a.transform[5];
                  }
                  return a.transform[4] - b.transform[4];
              });

          const lines: OriginalTextObject[] = [];
          if (items.length > 0) {
              let currentLineItems: any[] = [items[0]];
              for (let j = 1; j < items.length; j++) {
                  const item = items[j];
                  const lastItem = currentLineItems[currentLineItems.length - 1];
                  const yDifference = Math.abs(item.transform[5] - lastItem.transform[5]);
                  if (yDifference > 2) {
                      lines.push(createLineFromItems(currentLineItems, i));
                      currentLineItems = [item];
                  } else {
                      currentLineItems.push(item);
                  }
              }
              lines.push(createLineFromItems(currentLineItems, i));
          }
          originalTextPerPage[i] = lines;
        }
        
        setPdfPages(pages);
        
        const initialState = { editorObjects: {}, originalText: originalTextPerPage };
        setHistory([initialState]);
        setHistoryIndex(0);

      } catch (error) {
        console.error("Error loading PDF:", error);
        setFile(null); // Reset on error
      } finally {
        setIsLoading(false);
      }
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const updateHistory = useCallback((newState: HistoryState) => {
     setHistory(currentHistory => {
        const historySlice = currentHistory.slice(0, historyIndex + 1);
        return [...historySlice, newState];
     });
     setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const addEditorObject = useCallback((obj: EditorObject) => {
    const currentState = history[historyIndex];
    const newEditorObjects = JSON.parse(JSON.stringify(currentState.editorObjects));
    const page = currentPage;
    newEditorObjects[page] = [...(newEditorObjects[page] || []), obj];
    updateHistory({ ...currentState, editorObjects: newEditorObjects });
  }, [historyIndex, history, updateHistory, currentPage]);
  
  const updateEditorObject = useCallback((objectId: string, updates: Partial<EditorObject>) => {
    const currentState = history[historyIndex];
    const newEditorObjects = JSON.parse(JSON.stringify(currentState.editorObjects));
    const page = currentPage;
    const pageObjects = (newEditorObjects[page] || []).map(o =>
        o.id === objectId ? { ...o, ...updates } : o
    );
    newEditorObjects[page] = pageObjects;
    updateHistory({ ...currentState, editorObjects: newEditorObjects });
  }, [historyIndex, history, updateHistory, currentPage]);

  const updateOriginalText = useCallback((objectId: string, updates: Partial<OriginalTextObject>) => {
    const currentState = history[historyIndex];
    const newOriginalText = JSON.parse(JSON.stringify(currentState.originalText));
    const page = currentPage;
    const pageObjects = (newOriginalText[page] || []).map(o =>
        o.id === objectId ? { ...o, ...updates } : o
    );
    newOriginalText[page] = pageObjects;
    updateHistory({ ...currentState, originalText: newOriginalText });
  }, [historyIndex, history, updateHistory, currentPage]);

  const deleteObject = useCallback((objectId: string) => {
    setSelectedObjectId(null);
    const currentState = history[historyIndex];
    const page = currentPage;
    
    let newEditorObjects = JSON.parse(JSON.stringify(currentState.editorObjects));
    if (newEditorObjects[page]?.some(o => o.id === objectId)) {
        newEditorObjects[page] = newEditorObjects[page].filter(o => o.id !== objectId);
        updateHistory({ ...currentState, editorObjects: newEditorObjects });
        return;
    }
    
    let newOriginalText = JSON.parse(JSON.stringify(currentState.originalText));
     if (newOriginalText[page]?.some(o => o.id === objectId)) {
        // Completely remove the text object instead of just clearing the text
        newOriginalText[page] = newOriginalText[page].filter(o => o.id !== objectId);
        updateHistory({ ...currentState, originalText: newOriginalText });
        console.log('Updated originalText:', newOriginalText);
        return;
    }

  }, [historyIndex, history, updateHistory, currentPage]);

  const resetOriginalTextPosition = useCallback((objectId: string) => {
    const currentState = history[historyIndex];
    const newOriginalText = JSON.parse(JSON.stringify(currentState.originalText));
    const page = currentPage;
    const pageObjects = (newOriginalText[page] || []).map(o =>
        o.id === objectId ? { ...o, draggedX: 0, draggedY: 0, isDragged: false } : o
    );
    newOriginalText[page] = pageObjects;
    updateHistory({ ...currentState, originalText: newOriginalText });
  }, [historyIndex, history, updateHistory, currentPage]);


  const undo = useCallback(() => {
    if (canUndo) {
      setSelectedObjectId(null);
      setHistoryIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setSelectedObjectId(null);
      setHistoryIndex(prev => prev + 1);
    }
  }, [canRedo]);


  const handleSave = async () => {
    if (!pdfDoc) return;
    setIsSaving(true);
    try {
        const { rgb, StandardFonts } = PDFLib;
        const finalState = history[historyIndex];
        const initialState = history[0];

        const hexToRgb = (hex: string) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16) / 255,
                g: parseInt(result[2], 16) / 255,
                b: parseInt(result[3], 16) / 255,
            } : { r: 0, g: 0, b: 0 };
        };

        const getFont = (weight: number, style: string) => {
            if (weight >= 700 && style === 'italic') return StandardFonts.HelveticaBoldOblique;
            if (weight >= 700) return StandardFonts.HelveticaBold;
            if (style === 'italic') return StandardFonts.HelveticaOblique;
            return StandardFonts.Helvetica;
        };

        for (let pageNum = 1; pageNum <= pdfDoc.getPageCount(); pageNum++) {
            const page = pdfDoc.getPages()[pageNum - 1];
            
            // 1. Handle modified original text
            const modifiedObjects = finalState.originalText[pageNum] || [];
            const initialObjects = initialState.originalText[pageNum] || [];

            // Handle removed text objects (whiteout only)
            const removedObjects = initialObjects.filter(initialObj => 
                !modifiedObjects.some(modifiedObj => modifiedObj.id === initialObj.id)
            );
            
            for (const removedObj of removedObjects) {
                const [a, b, c, d, e, f] = removedObj.transform;
                const h = removedObj.height;
                const w = removedObj.width;
                const fontSize = Math.sqrt(a*a + b*b);
                
                page.drawRectangle({
                    x: e,
                    y: f - (fontSize * 0.2), // Adjust for baseline
                    width: w,
                    height: h * 1.2, // Generous height for whiteout
                    color: rgb(1, 1, 1),
                });
            }

            // Handle modified text objects
            for (const modifiedObj of modifiedObjects) {
                const initialObj = initialObjects.find(o => o.id === modifiedObj.id);
                // Check if the object text has been changed, cleared, or moved
                const textChanged = initialObj && initialObj.text !== modifiedObj.text;
                const positionChanged = modifiedObj.isDragged && (modifiedObj.draggedX !== 0 || modifiedObj.draggedY !== 0);
                
                if (textChanged || positionChanged) {
                     // Use the original transform data for precise whiteout
                    const [a, b, c, d, e, f] = initialObj.transform;
                    const h = initialObj.height;
                    const w = initialObj.width;
                    const fontSize = Math.sqrt(a*a + b*b);
                    
                    page.drawRectangle({
                        x: e,
                        y: f - (fontSize * 0.2), // Adjust for baseline
                        width: w,
                        height: h * 1.2, // Generous height for whiteout
                        color: rgb(1, 1, 1),
                    });

                    if (modifiedObj.text) {
                        const font = await pdfDoc.embedFont(getFont(modifiedObj.fontWeight, modifiedObj.fontStyle));
                        const color = hexToRgb(modifiedObj.color);
                        
                        // Calculate new position if the text has been moved
                        const newX = e + (modifiedObj.draggedX || 0);
                        const newY = f + (modifiedObj.draggedY || 0);
                        
                        page.drawText(modifiedObj.text, {
                            x: newX,
                            y: newY,
                            font,
                            size: modifiedObj.fontSize,
                            color: rgb(color.r, color.g, color.b),
                        });
                    }
                }
            }
            
            // 2. Handle newly added objects
            const addedObjects = finalState.editorObjects[pageNum] || [];
            const { height: pageHeight } = page.getSize();
            
            for (const obj of addedObjects) {
                const y = pageHeight - obj.y;
                if (obj.type === 'text') {
                    const font = await pdfDoc.embedFont(getFont(obj.fontWeight, obj.fontStyle));
                    const color = hexToRgb(obj.color);
                    page.drawText(obj.text, { x: obj.x, y: y - obj.height, font, size: obj.fontSize, lineHeight: obj.fontSize * 1.2, maxWidth: obj.width, color: rgb(color.r, color.g, color.b)});
                } else if (obj.type === 'image') {
                    const imageBytes = await fetch(obj.src).then(res => res.arrayBuffer());
                    const image = await pdfDoc.embedPng(imageBytes);
                    page.drawImage(image, { x: obj.x, y: y - obj.height, width: obj.width, height: obj.height });
                } else if (obj.type === 'shape' && obj.shape === 'rectangle') {
                    page.drawRectangle({ x: obj.x, y: y - obj.height, width: obj.width, height: obj.height, borderColor: rgb(0, 0, 0), borderWidth: 2 });
                } else if (obj.type === 'draw') {
                    const path = obj.points.map((p, i) => {
                        const pathY = pageHeight - p.y;
                        return i === 0 ? `M ${p.x} ${pathY}` : `L ${p.x} ${pathY}`;
                    }).join(' ');
                    page.drawSvgPath(path, { borderColor: rgb(0, 0, 0), borderWidth: 2 });
                }
            }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = file?.name.replace('.pdf', '-edited.pdf') || 'edited.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error saving PDF:", error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSummarize = useCallback(async () => {
    if (!pdfPages.length) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
        let fullText = '';
        for (const page of pdfPages) {
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        if (fullText.trim().length === 0) {
            setSummary("Could not extract any text from this PDF. It might be an image-based PDF.");
            return;
        }
        const result = await summarizePdfText(fullText);
        setSummary(result);
    } catch (error) {
        console.error("Error summarizing PDF:", error);
        setSummary("An error occurred while summarizing the document.");
    } finally {
        setIsSummarizing(false);
    }
  }, [pdfPages]);
  
  const resetApp = () => {
    setFile(null);
    setPdfDoc(null);
    setPdfPages([]);
    setCurrentPage(1);
    setSelectedTool('select');
    setHistory([{ editorObjects: {}, originalText: {} }]);
    setHistoryIndex(0);
    setSummary(null);
    setSelectedObjectId(null);
  };


  if (!file) {
      return (
          <div className="flex h-screen items-center justify-center bg-gray-800 text-white">
            {isLoading ? <SpinnerIcon/> : <FileUpload onFileSelect={handleFileChange} />}
        </div>
      );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-800 text-white font-sans">
        {isSidebarOpen && <div onClick={toggleSidebar} className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"/>}
        <Header 
            fileName={file.name}
            onClose={resetApp}
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
            onSummarize={handleSummarize}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            zoom={zoom}
            onZoomChange={handleZoom}
            onToggleSidebar={toggleSidebar}
        />
        <main className="flex-grow flex overflow-hidden">
            <Sidebar
                pages={pdfPages}
                currentPage={currentPage}
                onPageSelect={(page) => {
                    setCurrentPage(page);
                    setSelectedObjectId(null);
                    // Close sidebar on mobile after selecting a page
                    if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                    }
                }}
                isOpen={isSidebarOpen}
            />
            <div className="flex-grow bg-gray-700 overflow-auto p-4 md:p-8 flex justify-center items-start">
                {isLoading ? <SpinnerIcon/> : (
                <PdfViewer
                    page={pdfPages[currentPage - 1]}
                    zoom={zoom}
                    objects={editorObjects[currentPage] || []}
                    originalText={originalText[currentPage] || []}
                    tool={selectedTool}
                    onAddObject={addEditorObject}
                    onUpdateObject={updateEditorObject}
                    onUpdateOriginalText={updateOriginalText}
                    onDeleteObject={deleteObject}
                    onResetOriginalTextPosition={resetOriginalTextPosition}
                    selectedObjectId={selectedObjectId}
                    onSelectObject={setSelectedObjectId}
                />
                )}
            </div>
        </main>
        <footer className="flex justify-center p-3 bg-gray-900 shadow-inner">
             <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-2 rounded-md bg-green-600 text-white font-bold hover:bg-green-700 transition-transform duration-150 ease-in-out active:scale-95 flex items-center gap-2 disabled:bg-green-800 disabled:cursor-not-allowed"
                >
                {isSaving ? <SpinnerIcon /> : <SaveIcon />}
                <span>{isSaving ? 'Applying Changes...' : 'Apply Changes'}</span>
            </button>
        </footer>

        {(isSummarizing || summary) && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[80vh] flex flex-col">
                <h2 className="text-2xl font-bold mb-4 text-cyan-400">Document Summary</h2>
                <div className="flex-grow overflow-y-auto pr-2">
                {isSummarizing ? (
                    <div className="flex flex-col items-center justify-center h-full">
                    <SpinnerIcon />
                    <p className="mt-4 text-lg">Analyzing document...</p>
                    </div>
                ) : (
                    <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
                )}
                </div>
                <button
                onClick={() => setSummary(null)}
                className="mt-6 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded transition-colors"
                >
                Close
                </button>
            </div>
            </div>
        )}
    </div>
  );
};

export default App;