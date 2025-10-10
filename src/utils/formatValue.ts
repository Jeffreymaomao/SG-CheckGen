import dayjs from "dayjs";

export function formatDate(value: string | Date | undefined, pattern: string): string {
  if (!value) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format(pattern) : String(value);
}

export function formatCurrency(amount: number): string {
  if (Number.isNaN(amount)) return "";
  return amount.toLocaleString("zh-TW", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

const DIGITS = ["零", "壹", "貳", "參", "肆", "伍", "陸", "柒", "捌", "玖"];
const UNITS = ["", "拾", "佰", "仟"];
const SECTION_UNITS = ["", "萬", "億", "兆"];
const DECIMAL_UNITS = ["角", "分"];

export function toCjkUpper(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "";
  }

  if (amount === 0) {
    return "零元整";
  }

  const sign = amount < 0 ? "負" : "";
  let val = Math.abs(amount);
  const integerPart = Math.floor(val);
  const decimalPart = Math.round((val - integerPart) * 100);

  const sections: string[] = [];
  let integer = integerPart;
  let unitPos = 0;

  while (integer > 0) {
    const section = integer % 10000;
    if (section !== 0) {
      const sectionText = sectionToChinese(section);
      sections.unshift(sectionText + SECTION_UNITS[unitPos]);
    } else if (sections.length && !sections[0].startsWith("零")) {
      sections.unshift("零");
    }
    integer = Math.floor(integer / 10000);
    unitPos += 1;
  }

  const merged = mergeSections(sections);
  const integerText = merged ? `${merged}元` : "";

  if (decimalPart === 0) {
    return `${sign}${integerText}整`;
  }

  const jiao = Math.floor(decimalPart / 10);
  const fen = decimalPart % 10;
  const decimals: string[] = [];

  if (jiao > 0) {
    decimals.push(`${DIGITS[jiao]}${DECIMAL_UNITS[0]}`);
  }
  if (fen > 0) {
    decimals.push(`${DIGITS[fen]}${DECIMAL_UNITS[1]}`);
  }

  return `${sign}${integerText}${decimals.join("")}`;
}

function sectionToChinese(section: number): string {
  let rest = section;
  const digits: string[] = [];
  let zero = true;

  for (let i = 0; i < UNITS.length && rest > 0; i += 1) {
    const digit = rest % 10;
    if (digit === 0) {
      if (!zero) {
        digits.unshift("零");
      }
      zero = true;
    } else {
      digits.unshift(`${DIGITS[digit]}${UNITS[i]}`);
      zero = false;
    }
    rest = Math.floor(rest / 10);
  }

  return digits.join("").replace(/零+/g, "零").replace(/零$/, "");
}

function mergeSections(sections: string[]): string {
  return sections
    .join("")
    .replace(/零+萬/g, "零萬")
    .replace(/零+億/g, "零億")
    .replace(/零+兆/g, "零兆")
    .replace(/零+/g, "零")
    .replace(/零(萬|億|兆)/g, "$1")
    .replace(/零元/, "元")
    .replace(/^零+/, "");
}

export function applyFormat(value: unknown, format?: string): string {
  if (value == null) return "";
  if (!format) return String(value);

  if (format === "currency") {
    return formatCurrency(Number(value));
  }

  if (format === "cjk_upper") {
    return toCjkUpper(Number(value));
  }

  if (format.includes("Y") || format.includes("M") || format.includes("D")) {
    return formatDate(String(value), format);
  }

  return String(value);
}
