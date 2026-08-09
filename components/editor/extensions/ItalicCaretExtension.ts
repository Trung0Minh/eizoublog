import { Extension } from "@tiptap/core"
import { Plugin } from "@tiptap/pm/state"
import { Decoration, DecorationSet } from "@tiptap/pm/view"

export const ItalicCaretExtension = Extension.create({
  name: "italicCaret",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const { $from, empty } = state.selection
            const isItalic = $from.marks().some((mark) => mark.type.name === "italic")

            if (!empty || !isItalic) {
              return null
            }

            return DecorationSet.create(state.doc, [
              Decoration.widget(
                $from.pos,
                () => {
                  const caret = document.createElement("span")
                  caret.setAttribute("aria-hidden", "true")
                  caret.className = "prose-editor__italic-caret"
                  return caret
                },
                { side: -1 },
              ),
            ])
          },
        },
      }),
    ]
  },
})
