"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Heading from "@tiptap/extension-heading"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
  RemoveFormatting
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TiptapEditorProps {
  content?: string
  onChange?: (content: string) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function TiptapEditor({
  content = "",
  onChange,
  placeholder = "Start writing...",
  className,
  editable = true
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bulletList: false,
        orderedList: false
      }),
      Heading.configure({
        levels: [2, 3]
      }),
      BulletList,
      OrderedList,
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3"
      }
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn("rounded-lg border bg-background", className)}>
      {/* Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-1 border-b p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bold") && "bg-accent text-accent-foreground"
            )}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("italic") && "bg-accent text-accent-foreground"
            )}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("heading", { level: 2 }) &&
                "bg-accent text-accent-foreground"
            )}
            title="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("heading", { level: 3 }) &&
                "bg-accent text-accent-foreground"
            )}
            title="Heading 3"
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("bulletList") && "bg-accent text-accent-foreground"
            )}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "h-8 w-8 p-0",
              editor.isActive("orderedList") && "bg-accent text-accent-foreground"
            )}
            title="Ordered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              editor.chain().focus().unsetAllMarks().clearNodes().run()
            }
            className="h-8 w-8 p-0"
            title="Clear Formatting"
          >
            <RemoveFormatting className="h-4 w-4" />
          </Button>

          <div className="flex-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="h-8 w-8 p-0"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="h-8 w-8 p-0"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} />
    </div>
  )
}
