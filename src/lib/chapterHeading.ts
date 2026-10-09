import Heading from '@tiptap/extension-heading'

/**
 * 扩展 TipTap 的 Heading 节点，给 H1 加上 data-chapter-id 属性。
 * 新插入的 H1 自动生成 UUID 作为 chapter id。
 */
export const ChapterHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-chapter-id': {
        default: null,
        parseHTML: (element) => element.getAttribute('data-chapter-id'),
        renderHTML: (attributes) => {
          if (!attributes['data-chapter-id']) return {}
          return { 'data-chapter-id': attributes['data-chapter-id'] }
        },
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      ...this.parent?.(),
    }
  },

  // 当通过命令创建 H1 时，自动添加 chapter id
  onTransaction({ transaction }) {
    if (!transaction.docChanged) return

    const { doc } = transaction
    let needsFix = false
    const fixes: { pos: number }[] = []

    doc.forEach((node, offset) => {
      if (
        node.type.name === 'heading' &&
        node.attrs.level === 1 &&
        !node.attrs['data-chapter-id']
      ) {
        needsFix = true
        fixes.push({ pos: offset })
      }
    })

    if (needsFix && this.editor) {
      // 使用 requestAnimationFrame 避免在 transaction 回调中直接 dispatch
      requestAnimationFrame(() => {
        if (!this.editor || this.editor.isDestroyed) return
        const { tr } = this.editor.state
        let applied = false

        this.editor.state.doc.forEach((node, offset) => {
          if (
            node.type.name === 'heading' &&
            node.attrs.level === 1 &&
            !node.attrs['data-chapter-id']
          ) {
            tr.setNodeMarkup(offset, undefined, {
              ...node.attrs,
              'data-chapter-id': crypto.randomUUID(),
            })
            applied = true
          }
        })

        if (applied) {
          this.editor.view.dispatch(tr)
        }
      })
    }
  },
})
