import defaultTemplate from "../templates/default_tw_bank.json";
import type { CheckTemplate } from "../types";

export class TemplateAgent {
  private templates: Map<string, CheckTemplate> = new Map();
  private activeId: string;

  constructor(initial?: CheckTemplate[]) {
    const bundled = [defaultTemplate as CheckTemplate, ...(initial ?? [])];
    bundled.forEach((template) => {
      this.templates.set(template.id, template);
    });
    this.activeId = bundled[0]?.id ?? "";
  }

  getAll(): CheckTemplate[] {
    return Array.from(this.templates.values());
  }

  getActive(): CheckTemplate | undefined {
    return this.templates.get(this.activeId);
  }

  setActive(id: string): CheckTemplate | undefined {
    if (this.templates.has(id)) {
      this.activeId = id;
    }
    return this.getActive();
  }

  addTemplate(template: CheckTemplate): void {
    this.templates.set(template.id, template);
    if (!this.activeId) {
      this.activeId = template.id;
    }
  }
}
