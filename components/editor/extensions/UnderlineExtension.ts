import { Mark, mergeAttributes } from "@tiptap/core"

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    underline: {
      setUnderline: () => ReturnType
      toggleUnderline: () => ReturnType
      unsetUnderline: () => ReturnType
    }
  }
}

export const UnderlineExtension = Mark.create({
  addCommands() {
    return {
      setUnderline:
        () =>
        ({ commands }) =>
          commands.setMark(this.name),
      toggleUnderline:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
      unsetUnderline:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },

  addKeyboardShortcuts() {
    return {
      "Mod-u": () => this.editor.commands.toggleUnderline(),
    }
  },

  name: "underline",

  parseHTML() {
    return [
      { tag: "u" },
      {
        getAttrs: (value) =>
          typeof value === "string" && value.includes("underline")
            ? {}
            : false,
        style: "text-decoration",
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "u",
      mergeAttributes({ class: "underline underline-offset-2" }, HTMLAttributes),
      0,
    ]
  },
})
