// chrome.contextMenus.create({
//   id: "summarize",
//   title: "✨ Summarize Selection",
//   contexts: ["selection"]
// });

import { NEW_CHAT_CONTEXT_MENU_ID, OPEN_OPTIONS_CONTEXT_MENU_ID } from "@/constants/constants";
import { Features } from "@/window/SettingsPage";

// chrome.contextMenus.create({
//   id: "translate",
//   title: "🌏 Translate Selection",
//   contexts: ["selection"]
// });

// chrome.contextMenus.create({
//   id: "correct-english",
//   title: "👌 Correct English",
//   contexts: ["selection"]
// });

// chrome.contextMenus.create({
//   id: "teach-me",
//   title: "🎓 Teach Me This",
//   contexts: ["selection"]
// });

// // separates here...
// chrome.contextMenus.create({
//   id: 's2',
//   title: 'Separator',
//   type: "separator",
//   contexts: ['selection'],
// });

// chrome.contextMenus.create({
//   id: "dictionary",
//   title: "📚 English Dictionary",
//   contexts: ["selection"]
// });

let addedMenus: Set<string> = new Set();

chrome.runtime.onInstalled.addListener(async () => {
  await updateContextMenu();
  if (!addedMenus.has('openOptions')) {
    chrome.contextMenus.create({
      id: 'openOptions',
      title: 'Cài đặt',
      contexts: ['action']
    });
    addedMenus.add('openOptions');
  }
});

chrome.storage.onChanged.addListener(async (changes) => {
  if (changes.features) {
    await updateContextMenu();
  }
});

async function updateContextMenu() {
  // Xóa toàn bộ menu cũ
  chrome.contextMenus.removeAll();

  // Thêm menu cố định
  chrome.contextMenus.create({
    id: NEW_CHAT_CONTEXT_MENU_ID,
    title: "NEW CHAT",
    contexts: ["all"]
  });

  // Thêm menu mới
  const result = await chrome.storage.local.get('features');
  const features = result.features || {};

  // Thêm menu mới
  Object.entries(features as Features).forEach(([key, feature]) => {
    if (feature.enabled) {
      try {
        chrome.contextMenus.create({
          id: feature.id,
          title: feature.icon + " " + feature.name,
          contexts: ['selection']
        });
      } catch (error) {
        console.error(`Lỗi khi tạo menu item [${feature.id}] ${feature.name}:`, error);
      }
    }
  });
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === OPEN_OPTIONS_CONTEXT_MENU_ID) {
    chrome.runtime.openOptionsPage();
    return;
  }

  if (tab?.id) {

    let markdownContent = info.selectionText;

    try{
      // Gửi message đến content script
      markdownContent = await chrome.tabs.sendMessage(tab.id, {
        action: 'getSelectedHTML',
        selectionText: info.selectionText
      });
    }catch(error){
      console.error('Lỗi khi gửi message đến content script:', error);
    }
      
    if (!markdownContent) {
      markdownContent = info.selectionText;
    }

    // Lưu markdown content
    await chrome.storage.local.set({
      markdownContent,
      menuItemId: info.menuItemId
    });

    try {
      // Mở cửa sổ chat
      try{
        chrome.system.display.getInfo((displays) => {
          const primaryDisplay = displays.find(d => d.isPrimary);
          if (!primaryDisplay) {
            console.error('Không tìm thấy màn hình chính');
            return;
          }

          const screenWidth = primaryDisplay.workArea.width;
          const screenHeight = primaryDisplay.workArea.height;
          const width = Math.floor(screenWidth * 0.85);
          const height = Math.floor(screenHeight * 0.85);

          chrome.windows.create({
            url: 'window.html',
            type: 'popup',
            width,
            height,
            left: Math.floor((screenWidth - width) / 2),
            top: Math.floor((screenHeight - height) / 2)
          });
        });
      }catch(error){
        chrome.windows.create({
          url: 'window.html',
          type: 'popup',
          width: 800,
          height: 800
        });
      }
    } catch (error) {
      console.error('Lỗi khi mở window:', error);
      // Xử lý lỗi, ví dụ hiển thị thông báo cho người dùng
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenu') {
    updateContextMenu().then(() => sendResponse({ success: true }));
    return true; // Giữ kết nối mở để gửi response
  }
});