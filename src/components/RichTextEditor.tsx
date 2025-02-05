import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
// import { Delta, DeltaStatic } from 'quill';
// import { toMarkdown } from 'quill-delta-to-markdown';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export interface RichTextEditorRef {
  focus: () => void;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({ value, onChange, placeholder, className }, ref) => {
  const quillRef = useRef<ReactQuill>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      quillRef.current?.focus();
    }
  }));

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean']
    ]
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image'
  ];

//   const handleChange = (content: string, delta: Delta, source: string, editor: ReactQuill.UnprivilegedEditor) => {
//     const markdown = toMarkdown(editor.getContents());
//     onChange(markdown);
//   };

  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className="h-full">
      <ReactQuill
        ref={quillRef}
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className={className}
      />
    </div>
  );
});

export default RichTextEditor; 