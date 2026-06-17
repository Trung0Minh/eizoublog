import ListItem from "@tiptap/extension-list-item"

export const ListItemExtension = ListItem.extend({
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.sinkListItem(this.name),
      "Shift-Tab": () => this.editor.commands.liftListItem(this.name),
    }
  },
})
