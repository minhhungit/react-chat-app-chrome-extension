import React from "react";
import MarkdownIt from 'markdown-it';
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";

interface MarkdownEditorProps {
  ref: any;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// Register plugins if required
// MdEditor.use(YOUR_PLUGINS_HERE);

const mdParser = new MarkdownIt(/* Markdown-it options */);

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  ref,
  value,
  onChange,
  placeholder,
}) => {
  return (
    <MdEditor
      ref={ref}
      value={value}
      style={{ height: "200px" }}
      placeholder={placeholder}
      onChange={({ text }) => onChange(text)}
      renderHTML={text => mdParser.render(text)}
    />
  );
};

export default MarkdownEditor; 