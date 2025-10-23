import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { EditorObject, Tool, TextObject, OriginalTextObject } from '../types';
import TextToolbar from './TextToolbar';

interface PdfViewerProps {
  page: any;
  zoom: number;
  objects: EditorObject[];
  originalText: OriginalTextObject[];
  tool: Tool;
  onAddObject: (obj: EditorObject) => void;
  onUpdateObject: (objectId: string, updates: Partial<EditorObject>) => void;
  onUpdateOriginalText: (objectId: string, updates: Partial<OriginalTextObject>) => void;
  onDeleteObject: (objectId: string) => void;
  onResetOriginalTextPosition: (objectId: string) => void;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string | null) => void;
}

type EditableObject = TextObject | OriginalTextObject;

const PdfViewer: React.FC<PdfViewerProps> = (props) => {
  const { page, zoom, objects, originalText, tool, onAddObject, onUpdateObject, onUpdateOriginalText, onDeleteObject, onResetOriginalTextPosition, selectedObjectId, onSelectObject } = props;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interactionRef = useRef<HTMLDivElement>(null);
  const [drawingState, setDrawingState] = useState<{ isDrawing: boolean; points: {x: number; y: number}[] }>({ isDrawing: false, points: [] });
  const [draggedObject, setDraggedObject] = useState<{ 
    id: string; 
    initialX: number; 
    initialY: number; 
    mouseStartX: number; 
    mouseStartY: number;
    type: 'editor' | 'original';
    originalTransform?: number[]; // Store original transform for original text
  } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const allObjects = [...objects, ...originalText];
  const selectedObject = allObjects.find(o => o.id === selectedObjectId) as EditableObject | undefined;

  const renderPage = useCallback(() => {
    if (!page || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const displayViewport = page.getViewport({ scale: zoom });
    const renderViewport = page.getViewport({ scale: zoom * dpr });

    canvas.width = renderViewport.width;
    canvas.height = renderViewport.height;
    canvas.style.width = `${displayViewport.width}px`;
    canvas.style.height = `${displayViewport.height}px`;

    const renderContext = { canvasContext: ctx, viewport: renderViewport };
    page.render(renderContext);
  }, [page, zoom]);
  
  useEffect(() => { renderPage(); }, [renderPage]);

  const getCoords = (e: React.MouseEvent): { x: number; y: number } | null => {
    if (!interactionRef.current) return null;
    const rect = interactionRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCoords(e);
    if (!coords) return;

    const target = e.target as HTMLElement;
    const objectId = target.dataset.id;
    
    if (tool === 'select') {
        onSelectObject(objectId || null);
        
        // Check if it's an editor object
        const editorObject = objects.find(o => o.id === objectId);
        if (objectId && editorObject && editorObject.type !== 'draw' && target.tagName !== 'TEXTAREA') {
            setDraggedObject({ 
                id: objectId, 
                initialX: editorObject.x, 
                initialY: editorObject.y, 
                mouseStartX: coords.x, 
                mouseStartY: coords.y,
                type: 'editor'
            });
            e.stopPropagation();
        }
        
        // Check if it's an original text object
        const originalObject = originalText.find(o => o.id === objectId);
        if (objectId && originalObject && target.tagName !== 'TEXTAREA') {
            setDraggedObject({ 
                id: objectId, 
                initialX: originalObject.draggedX || 0, 
                initialY: originalObject.draggedY || 0, 
                mouseStartX: coords.x, 
                mouseStartY: coords.y,
                type: 'original',
                originalTransform: originalObject.transform
            });
            e.stopPropagation();
        }
    } else if (tool === 'draw') {
      onSelectObject(null);
      setDrawingState({ isDrawing: true, points: [coords] });
    } else {
        onSelectObject(null);
    }
  };

  // Refined dragging logic to ensure smooth movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (tool === 'select' && draggedObject && interactionRef.current) {
      const coords = getCoords(e);
      if (coords) {
        const dx = coords.x - draggedObject.mouseStartX;
        const dy = coords.y - draggedObject.mouseStartY;
        const element = interactionRef.current.querySelector(`[data-id='${draggedObject.id}']`) as HTMLElement;
        if (element) {
          element.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      }
    } else if (tool === 'draw' && drawingState.isDrawing) {
      const coords = getCoords(e);
      if (coords) {
        setDrawingState((prev) => ({ ...prev, points: [...prev.points, coords] }));
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const coords = getCoords(e);
    if (!coords) return;

    if (tool === 'select' && draggedObject) {
      const dx = coords.x - draggedObject.mouseStartX;
      const dy = coords.y - draggedObject.mouseStartY;

      if (draggedObject.type === 'editor') {
        const newX = draggedObject.initialX + dx / zoom;
        const newY = draggedObject.initialY + dy / zoom;
        onUpdateObject(draggedObject.id, { x: newX, y: newY });
      } else if (draggedObject.type === 'original') {
        const newDraggedX = draggedObject.initialX + dx / zoom;
        const newDraggedY = draggedObject.initialY + dy / zoom;
        onUpdateOriginalText(draggedObject.id, {
          draggedX: newDraggedX,
          draggedY: newDraggedY,
          isDragged: true,
        });
      }

      if (interactionRef.current) {
        const element = interactionRef.current.querySelector(
          `[data-id='${draggedObject.id}']`
        ) as HTMLElement;
        if (element) {
          element.style.transform = '';
        }
      }
      setDraggedObject(null); // Ensure draggedObject is cleared after drag
    } else if (tool === 'draw' && drawingState.isDrawing) {
      if (drawingState.points.length > 1) {
        onAddObject({
          id: crypto.randomUUID(),
          type: 'draw',
          points: drawingState.points.map((p) => ({ x: p.x / zoom, y: p.y / zoom })),
          x: drawingState.points[0].x / zoom,
          y: drawingState.points[0].y / zoom,
        });
      }
      setDrawingState({ isDrawing: false, points: [] });
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (draggedObject || (e.target as HTMLElement).dataset.id) return;
    const coords = getCoords(e);
    if (!coords) return;
    onSelectObject(null);

    const scaledCoords = { x: coords.x / zoom, y: coords.y / zoom };
    
    if (tool === 'text') {
        const newId = crypto.randomUUID();
        const newTextObject: TextObject = { id: newId, type: 'text', text: 'Type here...', x: scaledCoords.x, y: scaledCoords.y, fontSize: 16, width: 150, height: 20, fontWeight: 400, fontStyle: 'normal', color: '#000000', fontFamily: 'Helvetica' };
        onAddObject(newTextObject);
        onSelectObject(newId);
        setEditingTextId(newId);
    } else if (tool === 'shape') {
      onAddObject({ id: crypto.randomUUID(), type: 'shape', shape: 'rectangle', x: scaledCoords.x, y: scaledCoords.y, width: 100, height: 50 });
    } else if (tool === 'image') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png, image/jpeg';
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const src = event.target?.result as string;
                    const img = new Image();
                    img.onload = () => { onAddObject({ id: crypto.randomUUID(), type: 'image', src, x: scaledCoords.x, y: scaledCoords.y, width: img.width * 0.2, height: img.height * 0.2 }); }
                    img.src = src;
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const objectId = target.dataset.id;
    if (tool === 'select' && objectId && !draggedObject) {
       const object = allObjects.find(o => o.id === objectId);
       if(object && ('text' in object)){
          onSelectObject(objectId);
          setEditingTextId(objectId);
       }
    }
  };
  
  const handleUpdateText = (id: string, updates: Partial<EditableObject>) => {
      const object = allObjects.find(o => o.id === id);
      if (!object) return;
      if ('type' in object && object.type === 'text') {
          onUpdateObject(id, updates);
      } else {
          onUpdateOriginalText(id, updates as Partial<OriginalTextObject>);
      }
  }

  const viewport = page?.getViewport({ scale: zoom });

  return (
    <div className="relative shadow-2xl" style={{ width: viewport?.width, height: viewport?.height, cursor: tool === 'draw' ? 'crosshair' : 'default' }}>
      <canvas ref={canvasRef} />
      <div 
        ref={interactionRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {selectedObject && ('text' in selectedObject) && (
            <TextToolbar
                object={selectedObject}
                viewerRef={interactionRef}
                zoom={zoom}
                onUpdate={handleUpdateText}
                onDelete={onDeleteObject}
            />
        )}
        
        {/* Render whiteout overlays for original positions of moved/deleted text */}
        {page && originalText.map(obj => {
          const isDragged = obj.isDragged && (obj.draggedX !== 0 || obj.draggedY !== 0);
          const isEmpty = !obj.text || obj.text.trim() === '';
          
          // Only render whiteout for original position if text is moved or deleted
          if (!isDragged && !isEmpty) return null;
          
          const bleed = 3;
          const [a_v, b_v, c_v, d_v, e_v, f_v] = viewport.transform;
          const [a_o, b_o, c_o, d_o, e_o, f_o] = obj.transform;
          const tx = (a_v * e_o + c_v * f_o + e_v);
          const ty = (b_v * e_o + d_v * f_o + f_v);
          const adjustedTop = ty - (obj.height * zoom * 0.8);

          return (
            <div
              key={`whiteout-${obj.id}`}
              className="absolute pointer-events-none"
              style={{
                left: `${tx - bleed}px`,
                top: `${adjustedTop - bleed}px`,
                width: `${obj.width * zoom + (bleed * 2)}px`,
                height: `${obj.height * zoom + (bleed * 2)}px`,
                backgroundColor: 'white',
                zIndex: 5, // Above PDF canvas, below interactive elements
              }}
            />
          );
        })}

        {/* Render original PDF text with precision */}
        {page && originalText.map(obj => {
          const isEditing = editingTextId === obj.id;
          const isSelected = selectedObjectId === obj.id;
          const isDragged = obj.isDragged && (obj.draggedX !== 0 || obj.draggedY !== 0);
          const isEmpty = !obj.text || obj.text.trim() === '';
          const isDeleted = !originalText.some(o => o.id === obj.id);
          
          // Skip rendering if text is empty, deleted, or not in the originalText array
          if (isEmpty || isDeleted) return null;
          
          const bleed = 3; // Increased bleed area for more robust coverage

          const [a_v, b_v, c_v, d_v, e_v, f_v] = viewport.transform;
          const [a_o, b_o, c_o, d_o, e_o, f_o] = obj.transform;
          const tx = (a_v * e_o + c_v * f_o + e_v);
          const ty = (b_v * e_o + d_v * f_o + f_v);

          // The ascent of a font (the part above the baseline) is typically ~80% of its height.
          // This refined calculation shifts the overlay down slightly to perfectly cover characters
          // with descenders (like 'g', 'y', 'p'), fixing all rendering artifacts.
          const adjustedTop = ty - (obj.height * zoom * 0.8);

          // Apply drag offset if the text has been moved
          const dragOffsetX = (obj.draggedX || 0) * zoom;
          const dragOffsetY = (obj.draggedY || 0) * zoom;

          // For moved text, only render at the new position (whiteout covers original)
          // For non-moved text, render at original position
          // For deleted text, don't render at all (whiteout covers original)

          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${tx - bleed + dragOffsetX}px`,
            top: `${adjustedTop - bleed + dragOffsetY}px`,
            width: `${obj.width * zoom + (bleed * 2)}px`,
            height: `${obj.height * zoom + (bleed * 2)}px`,
            fontFamily: obj.fontFamily,
            fontWeight: obj.fontWeight,
            fontStyle: obj.fontStyle,
            color: obj.color,
            fontSize: `${obj.fontSize * zoom}px`,
            lineHeight: 1,
            whiteSpace: 'pre',
            cursor: tool === 'select' ? 'pointer' : 'default',
            outline: isSelected ? '2px dashed blue' : (isDragged ? '1px solid rgba(59, 130, 246, 0.5)' : 'none'),
            outlineOffset: '2px',
            boxSizing: 'border-box',
            transition: draggedObject?.id === obj.id ? 'none' : 'outline 0.2s ease',
            backgroundColor: 'white',
            zIndex: isDragged ? 10 : 1, // Ensure dragged text appears above others
            boxShadow: isDragged ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none', // Add shadow to moved text
          };

          if (isEditing) {
            return (
              <textarea
                key={obj.id}
                data-id={obj.id}
                className="absolute text-black p-0 z-20 resize-none overflow-hidden rounded-sm shadow-md"
                style={{ ...baseStyle, backgroundColor: 'white', padding: `${bleed}px` }}
                value={obj.text}
                onChange={(e) => handleUpdateText(obj.id, { text: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
                onBlur={() => setEditingTextId(null)}
                autoFocus
              />
            )
          }

          return (
            <div 
              key={obj.id} 
              data-id={obj.id} 
              className="select-none" 
              style={{ ...baseStyle, display: 'flex', alignItems: 'center', padding: `0 ${bleed}px` }}
              onContextMenu={(e) => {
                e.preventDefault();
                if (isDragged) {
                  onResetOriginalTextPosition(obj.id);
                }
              }}
              title={isDragged ? "Right-click to reset position" : "Drag to move text"}
            >
              {obj.text}
            </div>
          );
        })}

        {/* Render user-added text objects */}
        {objects.filter((o): o is TextObject => o.type === 'text').map(obj => {
          const isEditing = editingTextId === obj.id;
          const isSelected = selectedObjectId === obj.id;

          const baseStyle: React.CSSProperties = {
            left: obj.x * zoom,
            top: obj.y * zoom,
            width: obj.width * zoom,
            minHeight: obj.height * zoom,
            fontSize: obj.fontSize * zoom,
            fontWeight: obj.fontWeight,
            fontStyle: obj.fontStyle,
            color: obj.color,
            fontFamily: obj.fontFamily,
            lineHeight: 1.2,
            cursor: tool === 'select' ? 'pointer' : 'default',
            position: 'absolute',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          };
          
          if (isEditing) {
            return (
              <textarea
                key={obj.id}
                className="absolute bg-white text-black p-0 z-20 resize-none overflow-hidden rounded-sm shadow-md"
                style={{ ...baseStyle, outline: '1px solid #38bdf8', WebkitAppearance: 'none', MozAppearance: 'none' }}
                value={obj.text}
                onChange={(e) => handleUpdateText(obj.id, { text: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur(); } }}
                onBlur={() => setEditingTextId(null)}
                autoFocus
              />
            )
          }
          return (
            <div key={obj.id} data-id={obj.id} className={`select-none ${isSelected ? 'outline outline-2 outline-blue-500 outline-dashed' : ''}`} style={baseStyle}>
              {obj.text || ''}
            </div>
          );
        })}

        {/* Render other user-added objects */}
        {objects.filter(o => o.type !== 'text').map(obj => {
          const isSelected = selectedObjectId === obj.id;
          const selectBorderStyle = isSelected ? '2px dashed blue' : 'none';
          const cursorStyle = tool === 'select' ? 'move' : 'default';

          const commonStyle = { position: 'absolute', left: obj.x * zoom, top: obj.y * zoom, cursor: cursorStyle, boxSizing: 'border-box' } as React.CSSProperties;

          switch(obj.type) {
            case 'image': return <img key={obj.id} data-id={obj.id} src={obj.src} style={{ ...commonStyle, width: obj.width * zoom, height: obj.height * zoom, border: selectBorderStyle }} alt="user upload"/>;
            case 'shape': return <div key={obj.id} data-id={obj.id} style={{ ...commonStyle, width: obj.width * zoom, height: obj.height * zoom, border: `2px solid black`, outline: isSelected ? '2px dashed blue' : 'none', outlineOffset: '2px' }}></div>;
            case 'draw': return <svg key={obj.id} className="absolute top-0 left-0 w-full h-full pointer-events-none"><path d={obj.points.map((p,i) => `${i === 0 ? 'M' : 'L'} ${p.x * zoom} ${p.y * zoom}`).join(' ')} stroke="black" strokeWidth="2" fill="none" /></svg>;
            default: return null;
          }
        })}

        {drawingState.isDrawing && drawingState.points.length > 1 && ( <svg className="absolute top-0 left-0 w-full h-full pointer-events-none"><path d={drawingState.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')} stroke="black" strokeWidth="2" fill="none" /></svg> )}
      </div>
    </div>
  );
};

export default PdfViewer;