// src/components/Editor.jsx
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import './Editor.css'; // Import a CSS file for styling

export default function Editor({ content, onUpdate }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    onUpdate: ({ editor }) => onUpdate(editor.getHTML()),
  });

  return <EditorContent editor={editor} className="tiptap-editor" />;
}
