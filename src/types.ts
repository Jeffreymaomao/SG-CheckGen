export interface RawRecord {
  [key: string]: string | number | undefined | null;
}

export interface CheckRecord extends RawRecord {
}

export interface TemplateField {
  key?: string;
  x: number;
  y: number;
  w?: number;
  h?: number;
  align?: "left" | "right" | "center";
  format?: string;
  static?: string;
  input?: {
    key?: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
  };
  fontSize?: number;
  fontWeight?: number;
  fill?: string;
  letterSpacing?: number;
}

export type TemplateDecor =
  | {
      type: "rect";
      x: number;
      y: number;
      w: number;
      h: number;
      radius?: number;
      stroke?: boolean;
      fill?: boolean;
    }
  | {
      type: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      stroke?: string;
      strokeWidth?: number;
    }
  | {
      type: "image";
      src: string;
      x: number;
      y: number;
      w: number;
      h: number;
      preserveAspectRatio?: string;
    };

export interface CheckTemplate {
  id: string;
  label: string;
  page: {
    unit: "mm" | "px";
    width: number;
    height: number;
    margin?: number;
  };
  font: {
    family: string;
    size: number;
    weight?: number;
  };
  fields: TemplateField[];
  decor?: TemplateDecor[];
}

export interface WorkbookSheet {
  name: string;
  headers: string[];
  records: RawRecord[];
}

export interface FileParseResult {
  sheets: WorkbookSheet[];
}
