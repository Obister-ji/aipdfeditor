export type Tool = 'select' | 'text' | 'image' | 'draw' | 'shape';

interface BaseEditorObject {
  id: string;
  x: number;
  y: number;
}

export interface TextObject extends BaseEditorObject {
  type: 'text';
  text: string;
  fontSize: number;
  width: number;
  height: number;
  fontWeight: number;
  fontStyle: string;
  color: string;
  fontFamily: string;
}

export interface ImageObject extends BaseEditorObject {
  type: 'image';
  src: string; // base64 data URL
  width: number;
  height: number;
  zIndex: number; // Controls layering (higher values appear in front)
}

export interface DrawObject extends BaseEditorObject {
  type: 'draw';
  points: { x: number; y: number }[];
}

export interface ShapeObject extends BaseEditorObject {
  type: 'shape';
  shape: 'rectangle';
  width: number;
  height: number;
}

export type EditorObject = TextObject | ImageObject | DrawObject | ShapeObject;

export interface OriginalTextObject {
  id: string;
  page: number;
  text: string;
  width: number;
  height: number;
  // Precise values for rendering and saving
  transform: number[];
  fontName: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: string;
  color: string;
  fontFamily: string;
  // Position tracking for drag and drop
  draggedX?: number; // X offset from original position
  draggedY?: number; // Y offset from original position
  isDragged?: boolean; // Whether this text has been moved
}