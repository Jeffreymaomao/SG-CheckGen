import type { CheckRecord, RawRecord } from "../types";
import { applyFormat, formatCurrency, toCjkUpper } from "../utils/formatValue";
import dayjs, { Dayjs } from "dayjs";

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

function toDayjsInput(v: unknown): string | number | Date | Dayjs | undefined {
  if (v == null) return undefined;
  if (dayjs.isDayjs(v)) return v;
  if (v instanceof Date) return v;
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") return v;
  return undefined; // {}, [], 其他雜項一律丟掉，避免 dayjs(undefined) 變成 now
}

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

      const parsed = toDayjsInput(dateRaw);
      const dateValue = parsed ? dayjs(parsed).format(this.dateFormat) : "";

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
