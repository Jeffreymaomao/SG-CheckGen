import type { FileParseResult, RawRecord } from "../types";
import { read, utils } from "xlsx";

export class FileAgent {
  async parse(input: File | ArrayBuffer | Uint8Array): Promise<FileParseResult> {
    const buffer = await this.toArrayBuffer(input);
    const workbook = read(buffer, { type: "array" });

    if (!workbook.SheetNames.length) {
      return { records: [], headers: [] };
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = utils.sheet_to_json<RawRecord>(sheet, { defval: "" });
    const headerRow = utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "" });
    const headers = Array.isArray(headerRow[0]) ? (headerRow[0] as string[]) : [];

    return {
      records: rows,
      headers
    };
  }

  private async toArrayBuffer(input: File | ArrayBuffer | Uint8Array): Promise<ArrayBuffer> {
    if (input instanceof ArrayBuffer) {
      return input;
    }

    if (input instanceof Uint8Array) {
      return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
    }

    if ("arrayBuffer" in input) {
      return input.arrayBuffer();
    }

    throw new Error("Unsupported input type for FileAgent");
  }
}
