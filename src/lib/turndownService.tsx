import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx", // Dùng # cho tiêu đề
  bulletListMarker: "-", // Dùng - cho danh sách không thứ tự
  codeBlockStyle: "fenced", // Dùng ``` cho code block
});

// Thêm các quy tắc tuỳ chỉnh với kiểm tra null
turndownService.addRule("removeStyle", {
  filter: (node) => node?.nodeName === "STYLE" || node?.nodeName === "SCRIPT",
  replacement: () => "", // Bỏ qua <style> và <script>
});

turndownService.addRule("code", {
  filter: ["code"],
  replacement: (content, node) => {
    const isInline = node?.parentNode?.nodeName !== "PRE";
    if (isInline) {
      return `\`${content}\``;
    }
    return `\`\`\`\n${content || ""}\n\`\`\``;
  },
});

turndownService.addRule("image", {
  filter: "img",
  replacement: (content, node) => {
    try{
      const alt = (node as any)?.getAttribute("alt") || "";
      const src = (node as any)?.getAttribute("src") || "";
      return src ? `![${alt}](${src})` : "";
    }catch(error){
      return '';
    }
  },
});

turndownService.addRule("link", {
  filter: "a",
  replacement: (content, node) => {
    try{
      const href = (node as any)?.getAttribute("href") || "";
      return href ? `[${content}](${href})` : content;
    }catch(error){
      return '';
    }
  },
});

turndownService.addRule("table", {
  filter: "table",
  replacement: (content, node) => {
    if (!node) return "";

    const header = Array.from(node.querySelectorAll("thead th") || [])
      .map((th) => `| ${th.textContent?.trim() || ""} `)
      .join("") + "|";

    const divider = Array.from(node.querySelectorAll("thead th") || [])
      .map(() => "| --- ")
      .join("") + "|";

    const body = Array.from(node.querySelectorAll("tbody tr") || [])
      .map((tr) =>
        Array.from(tr.querySelectorAll("td") || [])
          .map((td) => `| ${td.textContent?.trim() || ""} `)
          .join("") + "|"
      )
      .join("\n");

    return `${header}\n${divider}\n${body}`;
  },
});

// Đảm bảo hỗ trợ các thành phần khác nếu cần
export default turndownService;
