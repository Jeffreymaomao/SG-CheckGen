import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { FileAgent } from "./FileAgent";
import { DataAgent } from "./DataAgent";
import { TemplateAgent } from "./TemplateAgent";
import { RenderAgent } from "./RenderAgent";
import { ExportAgent } from "./ExportAgent";
import { PlatformAgent } from "./PlatformAgent";
import type { CheckRecord } from "../types";

const fileAgent = new FileAgent();

export const UIAgent: React.FC = () => {
  const platform = useMemo(() => new PlatformAgent(), []);
  const templateAgent = useMemo(() => new TemplateAgent(), []);
  const dataAgent = useMemo(() => new DataAgent(), []);
  const exportAgent = useMemo(() => new ExportAgent(platform), [platform]);

  const [records, setRecords] = useState<CheckRecord[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [activeTemplate, setActiveTemplate] = useState(templateAgent.getActive()?.id ?? "");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const recordRefs = useRef<(HTMLDivElement | null)[]>([]);

  const templates = templateAgent.getAll();
  const template = activeTemplate ? templateAgent.setActive(activeTemplate) : templateAgent.getActive();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleId = "print-page-size";
    let styleElement = document.getElementById(styleId) as HTMLStyleElement | null;

    if (!template) {
      styleElement?.remove();
      return;
    }

    const unit = template.page.unit ?? "mm";
    const margin = template.page.margin ?? 0;
    const css = `@media print {\n  @page {\n    size: ${template.page.width}${unit} ${template.page.height}${unit};\n    margin: ${margin}${unit};\n  }\n}`;

    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = css;

    return () => {
      styleElement?.remove();
    };
  }, [template]);

  const handleFileInput = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return;
    setLoading(true);
    try {
      const { records: rawRecords } = await fileAgent.parse(fileList[0]);
      const result = dataAgent.normalize(rawRecords);
      setRecords(result.records);
      setErrors(result.errors);
      setCurrentIndex(0);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to parse file"]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTauriOpen = async () => {
    setLoading(true);
    try {
      const binary = await platform.openFileDialog();
      if (!binary) return;
      const buffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength);
      const { records: rawRecords } = await fileAgent.parse(buffer);
      const result = dataAgent.normalize(rawRecords);
      setRecords(result.records);
      setErrors(result.errors);
      setCurrentIndex(0);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "Failed to read file"]);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const hasRecords = records.length > 0;

  useEffect(() => {
    recordRefs.current = recordRefs.current.slice(0, records.length);
  }, [records.length]);

  useEffect(() => {
    const node = recordRefs.current[currentIndex];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [currentIndex]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (!records.length) return;
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) {
        return;
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((prev) => Math.min(prev + 1, records.length - 1));
      }

      if (event.key === "ArrowLeft") {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [records.length]);

  return (
    <div className="flex h-full flex-col gap-4 p-4 print-no-padding-margin">
      <header className="flex flex-wrap items-center gap-3 no-print">
        <div className="flex items-center gap-2">
          <label
            htmlFor="file-input"
            className="cursor-pointer rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
          >
            Upload Excel
          </label>
          <input
            id="file-input"
            type="file"
            accept=".xlsx"
            className="hidden"
            onChange={(event) => handleFileInput(event.target.files)}
          />
          {platform.isTauri() && (
            <button
              type="button"
              onClick={handleTauriOpen}
              className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm hover:bg-slate-100"
            >
              Browse…
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-500">Template</span>
          <select
            className="rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            value={activeTemplate}
            onChange={(event) => {
              setActiveTemplate(event.target.value);
              setCurrentIndex(0);
            }}
          >
            {templates.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="no-print rounded bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => exportAgent.print()}
            disabled={!hasRecords}
          >
            Print
          </button>
        </div>
      </header>

      {errors.length > 0 && (
        <div className="no-print rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <p className="font-semibold">Issues detected</p>
          <ul className="list-disc pl-5">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <section className="flex-1 overflow-hidden overflow-y-auto rounded border border-slate-200 bg-white p-4 print-no-padding-margin" id="preview-container">
        {loading && <p className="text-sm text-slate-500">Parsing workbook…</p>}
        {!loading && !hasRecords && (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
            <p>Upload an Excel worksheet to preview printable checks.</p>
            <p>Ensure columns include payee, amount, date, and memo.</p>
          </div>
        )}
        {!loading && hasRecords && template && (
          <div className="flex flex-col gap-6">
            <div className="records-scroll overflow-x-auto pb-2 print-no-padding-margin">
              <div className="records-strip flex flex-nowrap gap-6 print-no-padding-margin print:flex-wrap">
                {records.map((item, idx) => (
                  <div
                    key={`${item.payee}-${idx}`}
                    className={clsx("records-page shrink-0 rounded border border-transparent transition print-no-padding-margin",
                      idx === currentIndex && "border-sky-400 ring-2 ring-sky-200"
                    )}
                    ref={(node) => {
                      recordRefs.current[idx] = node;
                    }}
                    onClick={() => setCurrentIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setCurrentIndex(idx);
                      }
                    }}
                  >
                    <RenderAgent template={template} record={item} pageIndex={idx} />
                  </div>
                ))}
              </div>
            </div>
            <details className="w-full rounded border border-slate-200 bg-slate-50 p-3 text-sm no-print">
              <summary className="cursor-pointer font-medium text-slate-700">Parsed Records Preview</summary>
              <div className="mt-3 max-h-48 overflow-auto rounded border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs text-slate-600">
                  <thead className="bg-slate-100 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Payee</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Amount (Upper)</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Memo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {records.map((item, idx) => (
                      <tr
                        key={item.payee + idx}
                        className={clsx("cursor-pointer", idx === currentIndex && "bg-sky-50")}
                        onClick={() => setCurrentIndex(idx)}
                      >
                        <td className="px-3 py-2 font-medium text-slate-700">{idx + 1}</td>
                        <td className="px-3 py-2">{item.payee}</td>
                        <td className="px-3 py-2">{item.amountFormatted}</td>
                        <td className="px-3 py-2">{item.amountCjk}</td>
                        <td className="px-3 py-2">{item.date}</td>
                        <td className="px-3 py-2">{item.memo ?? ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}
      </section>
    </div>
  );
};
