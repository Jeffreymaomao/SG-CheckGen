import type { CheckRecord, RawRecord } from "../types";
import { applyFormat, formatCurrency, toCjkUpper } from "../utils/formatValue";
import dayjs, { Dayjs } from "dayjs";

export interface FieldMapping {
  payee: string;
  amount: string;
  date?: string;
  memo?: string;
}

export interface DataAgentResult {
  records: CheckRecord[];
  errors: string[];
}

export class DataAgent {
  constructor() {
  }
  normalize(records: RawRecord[]): DataAgentResult {
    const clean: CheckRecord[] = [];
    const errors: string[] = [];

    return { records: records, errors };
  }
}
