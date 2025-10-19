import React, { useLayoutEffect } from "react";
import dayjs from "dayjs";
import type { CheckRecord, CheckTemplate, TemplateField } from "../types";
import { applyFormat } from "../utils/formatValue";
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export function parseExcelDate(
  serial: number,
  opts?: { date1904?: boolean }   // 若活頁簿使用 1904 系統，傳入 { date1904: true }
): dayjs.Dayjs {
  if (!Number.isFinite(serial)) return dayjs.invalid();

  const is1904 = !!opts?.date1904;

  // Excel 1900 系統的閏年 bug：序號 60 = 假的 1900-02-29
  if (!is1904 && serial === 60) return dayjs.invalid();

  const dayMs = 86400000;

  // 正確的 epoch：
  //  - 1900 系統：1899-12-31（序號 1 = 1900-01-01）
  //  - 1904 系統：1904-01-01（序號 0 = 1904-01-01）
  const epochUTC = is1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 31);

  // 1900 系統且序號 > 60 時，要扣掉假的 2/29
  const corrected = (!is1904 && serial > 60) ? serial - 1 : serial;

  const ms = epochUTC + corrected * dayMs;
  return dayjs.utc(ms);  // 用 UTC 避免本地時區/DST 影響
}

function usePrintPageSize(width: number, height: number, unit: "mm" | "in" | "cm" | "px") {
  useLayoutEffect(() => {
    const id = "PRINT_PAGE_SIZE_STYLE";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = `
      @media print {
        html, body {
          width: ${width}${unit} !important;
        }
        .print-page {
          width: ${width}${unit} !important;
          height: ${height}${unit} !important;
        }
      }
    `;
  }, [width, height, unit]);
}

export interface RenderAgentProps {
  template: CheckTemplate;
  record: CheckRecord;
  pageIndex: number;
  editMode?: boolean;
  customInputs?: Record<string, string>;
}

export const RenderAgent: React.FC<RenderAgentProps> = ({
  template,
  record,
  pageIndex,
  editMode,
  customInputs
}) => {
  const { page } = template;
  const unit = page.unit ?? "mm";
  usePrintPageSize(template.page.width, template.page.height, template.page.unit ?? "mm");

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

        {template.fields.map((field, idx) => {
          const inputKey = field.input
            ? field.input.key ?? field.key ?? `field_${idx}`
            : undefined;
          return (
            <FieldText
              key={idx}
              field={field}
              template={template}
              record={record}
              editMode={editMode}
              customInputs={customInputs}
              inputKey={inputKey}
            />
          );
        })}
      </svg>
    </div>
  );
};

interface FieldProps {
  field: TemplateField;
  template: CheckTemplate;
  record: CheckRecord;
  editMode?: boolean;
  customInputs?: Record<string, string>;
  inputKey?: string;
}

const FieldText: React.FC<FieldProps> = ({ field, template, record, editMode, customInputs, inputKey }) => {
  const text = resolveFieldValue(field, record, customInputs, inputKey);
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

function resolveFieldValue(
  field: TemplateField,
  record: CheckRecord,
  customInputs?: Record<string, string>,
  inputKey?: string
): string {
  if (field.input) {
    const key = inputKey ?? field.input.key ?? field.key ?? "";
    return customInputs?.[key] ?? field.input.defaultValue ?? "";
  }

  if (field.static != null) {
    return field.static;
  }

  const key = field.key;
  if (!key) {
    return "";
  }

  const rawValue = record[key];

  if (field.type === "date") {
    if (rawValue == null || rawValue === "") {
      return "";
    }

    let parsed: dayjs.Dayjs;
    if (typeof rawValue === "number") {
      parsed = parseExcelDate(rawValue);
    } else if (typeof rawValue === "string") {
      const trimmed = rawValue.trim();
      if (!trimmed) {
        return "";
      }
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) {
        parsed = parseExcelDate(numeric);
      } else {
        parsed = dayjs(trimmed);
      }
    } else {
      parsed = dayjs(String(rawValue));
    }

    if (!parsed.isValid()) {
      return "";
    }

    const dateFormat = field.format ?? "YYYY-MM-DD";
    return parsed.format(dateFormat);
  }

  if (field.format) {
    return applyFormat(rawValue, field.format);
  }

  if (rawValue == null) {
    return "";
  }

  return typeof rawValue === "string" ? rawValue : String(rawValue);
}
