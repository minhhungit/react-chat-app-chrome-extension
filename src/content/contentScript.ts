import turndownService from "@/lib/turndownService";

let testInject = function() {

    return {
        init: function(){
          console.log('Hello Jin I\'m testing');
        }
    }
}();

testInject.init();


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