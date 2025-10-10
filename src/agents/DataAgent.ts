import type { CheckRecord, RawRecord } from "../types";
import { applyFormat, formatCurrency, toCjkUpper } from "../utils/formatValue";
import dayjs from "dayjs";

export interface FieldMapping {
  payee: string;
  amount: string;
  date?: string;
  memo?: string;
}

export interface DataAgentOptions {
  mapping?: Partial<FieldMapping>;
  dateFormat?: string;
}

export interface DataAgentResult {
  records: CheckRecord[];
  errors: string[];
}

const DEFAULT_MAPPING: FieldMapping = {
  payee: "payee",
  amount: "amount",
  date: "date",
  memo: "memo"
};

export class DataAgent {
  private mapping: FieldMapping;
  private dateFormat: string;

  constructor(options?: DataAgentOptions) {
    this.mapping = { ...DEFAULT_MAPPING, ...(options?.mapping ?? {}) };
    this.dateFormat = options?.dateFormat ?? "YYYY-MM-DD";
  }

  normalize(records: RawRecord[]): DataAgentResult {
    const clean: CheckRecord[] = [];
    const errors: string[] = [];

    records.forEach((record, index) => {
      const payee = this.pick(record, this.mapping.payee);
      const amountRaw = this.pick(record, this.mapping.amount);
      const dateRaw = this.mapping.date ? this.pick(record, this.mapping.date) : undefined;
      const memo = this.mapping.memo ? this.pick(record, this.mapping.memo) : undefined;

      if (!payee) {
        errors.push(`Row ${index + 2}: Missing payee`);
        return;
      }

      const amount = Number(String(amountRaw).replace(/[^\d.-]/g, ""));
      if (Number.isNaN(amount)) {
        errors.push(`Row ${index + 2}: Invalid amount`);
        return;
      }

      const dateValue = dateRaw ? dayjs(dateRaw).format(this.dateFormat) : "";

      clean.push({
        payee: String(payee),
        amount,
        amountFormatted: formatCurrency(amount),
        amountCjk: toCjkUpper(amount),
        date: dateValue,
        memo: memo ? String(memo) : undefined,
        original: record
      });
    });

    return { records: clean, errors };
  }

  formatForTemplate(value: unknown, format?: string): string {
    return applyFormat(value, format);
  }

  private pick(record: RawRecord, key: string): unknown {
    if (record[key] != null) {
      return record[key];
    }

    const normalizedKey = key.toLowerCase();
    const entry = Object.entries(record).find(([k]) => k.toLowerCase() === normalizedKey);
    return entry ? entry[1] : undefined;
  }
}
