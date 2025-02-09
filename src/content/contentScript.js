import turndownService from "@/utils/turndownService";

let testInject = function() {

    return {
        init: function(){
          console.log('Hello Jin I\'m testing');
        }
    }
}();

testInject.init();


document.addEventListener('mouseup', function() {
  let selection = window.getSelection();
  if (selection != null && typeof selection !== 'undefined' && selection.rangeCount > 0) {
      let range = selection.getRangeAt(0);
      
      // Lấy phần tử cha gần nhất là một phần tử HTML
      let container = range.commonAncestorContainer;
        
      // Đảm bảo rằng container là một ELEMENT_NODE
      while (container.nodeType !== Node.ELEMENT_NODE) {
          container = container.parentNode;
      }

      // Sử dụng outerHTML để lấy toàn bộ mã HTML của phần tử cha
      let selectedHTML = container?.outerHTML || "";

      console.log("Selected Text:", selection.toString());
      console.log("Selected HTML:", selectedHTML);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSelectedHTML') {
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        sendResponse(null);
        return;
      }
      const range = selection.getRangeAt(0);
      const container = document.createElement('div');
      container.appendChild(range.cloneContents());
      
      // Xóa các thuộc tính không cần thiết
      Array.from(container.querySelectorAll('*')).forEach(element => {
        element.removeAttribute('style');
        element.removeAttribute('class');
        element.removeAttribute('id');
      });
      
      // sendResponse(container.innerHTML);
      let markdownContent= "";
      try{
        console.log(container);

        markdownContent = turndownService.turndown(container);
        sendResponse(markdownContent);
        
      }catch(error){
        console.error('Lỗi khi chuyển đổi HTML sang Markdown:', error);
        sendResponse(null);
      }
    } catch (error) {
      console.error('Lỗi trong content script:', error);
      sendResponse(null);
    }
  }
  return true; // Keep the message channel open for sendResponse
}); 