import type { CheckTemplate } from "../types";

const templateModules = import.meta.glob<CheckTemplate>("../templates/*.json", {
  eager: true,
  import: "default"
});

const bundledTemplates = Object.entries(templateModules)
  .sort(([pathA], [pathB]) => pathA.localeCompare(pathB))
  .map(([, template]) => template);

export class TemplateAgent {
  private templates: Map<string, CheckTemplate> = new Map();
  private activeId: string;

  constructor(initial?: CheckTemplate[]) {
    const bundled = [...bundledTemplates, ...(initial ?? [])];
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
