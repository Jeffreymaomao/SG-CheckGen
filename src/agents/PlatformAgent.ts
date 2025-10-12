export class PlatformAgent {
  isTauri(): boolean {
    return typeof window !== "undefined" && Boolean((window as any).__TAURI__);
  }

  async openFileDialog(): Promise<Uint8Array | null> {
    if (!this.isTauri()) {
      return null;
    }

    const { open } = await import("@tauri-apps/api/dialog");
    const { readBinaryFile } = await import("@tauri-apps/api/fs");

    const selected = await open({ multiple: false, filters: [{ name: "Excel", extensions: ["xlsx"] }] });
    if (!selected || Array.isArray(selected)) {
      return null;
    }

    return readBinaryFile(selected);
  }

  invokePrint(): void {
    window.print();
  }

  async exportPdf(elementId: string): Promise<void> {
    console.warn("exportPdf is not implemented yet", elementId);
  }
}
