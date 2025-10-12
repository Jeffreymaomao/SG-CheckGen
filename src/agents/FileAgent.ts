import type { FileParseResult, RawRecord, WorkbookSheet } from "../types";
import { read, utils } from "xlsx";

export class FileAgent {
  async parse(input: File | ArrayBuffer | Uint8Array): Promise<FileParseResult> {
    const buffer = await this.toArrayBuffer(input);
    const workbook = read(buffer, { type: "array" });

    if (!workbook.SheetNames.length) {
      return { sheets: [] };
    }

    const sheets: WorkbookSheet[] = workbook.SheetNames.map((name) => {
      const worksheet = workbook.Sheets[name];
      const rows = utils.sheet_to_json<RawRecord>(worksheet, { defval: "" });
      const headerRow = utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: "" });
      const headers = Array.isArray(headerRow[0]) ? (headerRow[0] as string[]) : [];

      return {
        name,
        headers,
        records: rows
      };
    });

    return { sheets };
  }

  private async toArrayBuffer(input: File | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
    if (input instanceof ArrayBuffer) {
      return input;
    }
  if (input instanceof Uint8Array) {
    const view = input;
    const ab = new ArrayBuffer(view.byteLength);
    new Uint8Array(ab).set(view);
    return ab;
  }

  if ("arrayBuffer" in input) {
    return await (input as File).arrayBuffer();
  }

    throw new Error("Unsupported input type for FileAgent");
  }
}
