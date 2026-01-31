"use client"

import { useState } from "react"
import { TiptapEditor } from "@/components/editor/tiptap-editor"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditorDemoPage() {
  const [content, setContent] = useState(`
    <h2>Welcome to the Tiptap Editor</h2>
    <p>This is a <strong>rich text editor</strong> built with Tiptap. Try out these features:</p>
    <ul>
      <li>Bold and <em>italic</em> text formatting</li>
      <li>Headings (H2 and H3)</li>
      <li>Bullet lists and numbered lists</li>
      <li>Undo and redo</li>
    </ul>
    <h3>Getting Started</h3>
    <p>Start typing to create your content. Use the toolbar above to format text.</p>
  `)

  return (
    <div className="container mx-auto p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Rich Text Editor</h1>
        <p className="mt-2 text-muted-foreground">
          A Tiptap-based editor component ready for your application
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle>Editor</CardTitle>
            <CardDescription>
              Try editing the content below using the toolbar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Write something amazing..."
            />
          </CardContent>
        </Card>

        {/* Output */}
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
            <CardDescription>See the HTML output in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="preview">
              <TabsList className="mb-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="html">HTML</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none rounded-lg border bg-muted/50 p-4"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </TabsContent>
              <TabsContent value="html">
                <pre className="max-h-[400px] overflow-auto rounded-lg border bg-muted/50 p-4 text-xs">
                  <code>{content}</code>
                </pre>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Usage Guide */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Usage</CardTitle>
          <CardDescription>How to use the TiptapEditor component</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-auto rounded-lg bg-muted p-4 text-sm">
            <code>{`import { TiptapEditor } from "@/components/editor/tiptap-editor"

// Basic usage
<TiptapEditor
  content={content}
  onChange={setContent}
  placeholder="Start writing..."
/>

// Read-only mode
<TiptapEditor
  content={content}
  editable={false}
/>

// Props:
// - content: string - Initial HTML content
// - onChange: (html: string) => void - Callback when content changes
// - placeholder: string - Placeholder text
// - editable: boolean - Enable/disable editing
// - className: string - Additional CSS classes`}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
