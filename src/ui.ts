import { App, Modal, Setting } from "obsidian";
export function choose<T extends string>(
  app: App,
  title: string,
  description: string,
  options: { label: string; value: T }[],
): Promise<T | null> {
  return new Promise((resolve) => {
    class Choice extends Modal {
      result: T | null = null;
      onOpen() {
        this.titleEl.setText(title);
        this.contentEl.createEl("p", { text: description });
        const row = this.contentEl.createDiv({ cls: "qrc-actions" });
        for (const option of options)
          row.createEl("button", { text: option.label }).onclick = () => {
            this.result = option.value;
            this.close();
          };
        row.createEl("button", { text: "Cancel" }).onclick = () => this.close();
      }
      onClose() {
        resolve(this.result);
        this.contentEl.empty();
      }
    }
    new Choice(app).open();
  });
}
export function askText(
  app: App,
  title: string,
  initial: string,
): Promise<string | null> {
  return new Promise((resolve) => {
    class Input extends Modal {
      result: string | null = null;
      onOpen() {
        this.titleEl.setText(title);
        let value = initial;
        new Setting(this.contentEl).addText((t) =>
          t.setValue(value).onChange((v) => (value = v)),
        );
        new Setting(this.contentEl)
          .addButton((b) =>
            b.setButtonText("Cancel").onClick(() => this.close()),
          )
          .addButton((b) =>
            b
              .setButtonText("Apply")
              .setCta()
              .onClick(() => {
                this.result = value;
                this.close();
              }),
          );
      }
      onClose() {
        resolve(this.result);
        this.contentEl.empty();
      }
    }
    new Input(app).open();
  });
}
