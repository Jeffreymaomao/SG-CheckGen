import { PlatformAgent } from "./PlatformAgent";

export class ExportAgent {
  private platform: PlatformAgent;

  constructor(platform: PlatformAgent) {
    this.platform = platform;
  }

  print(): void {
    if (this.platform.isTauri()) {
      this.platform.invokePrint();
    } else {
      window.print();
    }
  }

  async exportPdf(elementId: string): Promise<void> {
    await this.platform.exportPdf(elementId);
  }
}
