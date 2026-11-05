import { HtmlDocument } from "../src/html-notes/HtmlDocument";
import { VisualEditor } from "../src/html-notes/VisualEditor";
import { sourceEditor } from "../src/html-notes/SourceEditor";
import { installViewHarness } from "./browser-view-harness";
installViewHarness();

let editor: VisualEditor | undefined;
let model: HtmlDocument;
let copied = "";
const errors: string[] = [];
const root = document.getElementById("host")!;
Object.assign(root, {
  createEl(
    tag: string,
    options: { cls?: string; attr?: Record<string, string> },
  ) {
    const el = document.createElement(tag);
    if (options.cls) el.className = options.cls;
    for (const [name, value] of Object.entries(options.attr || {}))
      el.setAttribute(name, value);
    el.style.width = "100%";
    el.style.height = "700px";
    root.append(el);
    return el;
  },
});
Object.assign(window, {
  vkTest: {
    mount(source: string) {
      editor?.destroy();
      root.replaceChildren();
      model = new HtmlDocument(source);
      copied = "";
      errors.length = 0;
      editor = new VisualEditor(
        root,
        model.safe.html,
        model.safe.bodyStyle,
        false,
        (html) => {
          try {
            model.editBody(html);
          } catch (error) {
            errors.push(String(error));
          }
        },
        (event) => {
          if ("clipboardData" in event)
            editor?.insert(event.clipboardData?.getData("text/html") || "");
        },
        (event) => {
          event.preventDefault();
          copied = editor?.selectedHtml() || "";
        },
        () => {},
        (message) => errors.push(message),
      );
      editor.resource = () =>
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==";
    },
    get editor() {
      return editor!;
    },
    get model() {
      return model;
    },
    get copied() {
      return copied;
    },
    get errors() {
      return errors;
    },
    source() {
      editor?.destroy();
      return sourceEditor(
        root,
        model.source,
        (value) => model.setSource(value),
        () => {},
      );
    },
  },
});
