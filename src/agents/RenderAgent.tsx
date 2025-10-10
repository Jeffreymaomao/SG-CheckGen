import React from "react";
import type { CheckRecord, CheckTemplate, TemplateField } from "../types";
import { applyFormat } from "../utils/formatValue";

export interface RenderAgentProps {
  template: CheckTemplate;
  record: CheckRecord;
  pageIndex: number;
  editMode?: boolean;
}

export const RenderAgent: React.FC<RenderAgentProps> = ({
  template,
  record,
  pageIndex,
  editMode
}) => {
  const { page } = template;
  const unit = page.unit ?? "mm";

  return (
    <div
      className="print-page border border-slate-200 bg-white shadow-sm"
      style={{ width: `${page.width}${unit}`, height: `${page.height}${unit}` }}
      aria-label={`Check ${pageIndex + 1}`}
    >
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${page.width} ${page.height}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {template.decor?.map((item, idx) => {
          if (item.type === "rect") {
            return (
              <rect
                key={`decor-rect-${idx}`}
                x={item.x}
                y={item.y}
                width={item.w}
                height={item.h}
                rx={item.radius ?? 0}
                ry={item.radius ?? 0}
                fill={item.fill ? "rgba(148, 163, 184, 0.08)" : "none"}
                stroke={item.stroke ? "#94a3b8" : "none"}
                strokeWidth={item.stroke ? 0.4 : 0}
              />
            );
          }

          if (item.type === "line") {
            return (
              <line
                key={`decor-line-${idx}`}
                x1={item.x1}
                y1={item.y1}
                x2={item.x2}
                y2={item.y2}
                stroke={item.stroke ?? "#94a3b8"}
                strokeWidth={item.strokeWidth ?? 0.3}
              />
            );
          }

          if (item.type === "image") {
            return (
              <image
                key={`decor-img-${idx}`}
                href={item.src}
                x={item.x}
                y={item.y}
                width={item.w}
                height={item.h}
                preserveAspectRatio={item.preserveAspectRatio ?? "xMidYMid meet"}
              />
            );
          }

          return null;
        })}

        {template.fields.map((field, idx) => (
          <FieldText
            key={field.key ?? field.static ?? idx}
            field={field}
            template={template}
            record={record}
            editMode={editMode}
          />
        ))}
      </svg>
    </div>
  );
};

interface FieldProps {
  field: TemplateField;
  template: CheckTemplate;
  record: CheckRecord;
  editMode?: boolean;
}

const FieldText: React.FC<FieldProps> = ({ field, template, record, editMode }) => {
  const text = resolveFieldValue(field, record);
  const width = field.w ?? 0;
  const anchor = field.align === "right" ? "end" : field.align === "center" ? "middle" : "start";
  const x = field.align === "right" ? field.x + width : field.align === "center"
    ? field.x + width / 2
    : field.x;
  const fontSize = field.fontSize ?? template.font.size;
  const fontWeight = field.fontWeight ?? template.font.weight ?? 400;
  const fill = field.fill ?? "#0f172a";
  const letterSpacing = field.letterSpacing;

  return (
    <g>
      <text
        x={x}
        y={field.y}
        fontFamily={template.font.family}
        fontSize={fontSize}
        fontWeight={fontWeight}
        textAnchor={anchor}
        alignmentBaseline="hanging"
        fill={fill}
        letterSpacing={letterSpacing}
      >
        {text}
      </text>
      {editMode && width > 0 && (
        <rect
          x={field.x}
          y={field.y - fontSize * 0.8}
          width={width}
          height={fontSize * 1.2}
          fill="none"
          stroke="rgba(14, 116, 144, 0.4)"
          strokeDasharray="4 2"
        />
      )}
    </g>
  );
};

function resolveFieldValue(field: TemplateField, record: CheckRecord): string {
  if (field.static != null) {
    return field.static;
  }

  const key = field.key;
  if (!key) {
    return "";
  }

  switch (key) {
    case "payee":
      return record.payee;
    case "amount":
      return record.amountFormatted;
    case "amount_cn":
      return record.amountCjk;
    case "date":
      return field.format ? applyFormat(record.date, field.format) : record.date;
    case "memo":
      return record.memo ?? "";
    default: {
      const original = record.original[key];
      return applyFormat(original, field.format);
    }
  }
}
