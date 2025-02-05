import { db } from "@/utils/IndexedDBWrapper";
import { NEW_CHAT_CONTEXT_MENU_ID, OPEN_OPTIONS_CONTEXT_MENU_ID } from "@/constants/constants";
import { Features } from "@/settings/SettingsPage";

let addedMenus: Set<string> = new Set();

chrome.runtime.onInstalled.addListener(async () => {
  await updateContextMenu();
  // if (!addedMenus.has(OPEN_OPTIONS_CONTEXT_MENU_ID)) {
  //   chrome.contextMenus.create({
  //     id: OPEN_OPTIONS_CONTEXT_MENU_ID,
  //     title: '⚙️ Cài đặt',
  //     contexts: ['all']
  //   });
  //   addedMenus.add(OPEN_OPTIONS_CONTEXT_MENU_ID);
  // }
});

// try{
//   chrome.storage.onChanged.addListener(async (changes) => {
//     if (changes.features) {
//       await updateContextMenu();
//     }
//   });
// }catch(error){
//   console.error('Lỗi khi lắng nghe sự kiện thay đổi:', error);
// }

async function updateContextMenu() {
  // Xóa toàn bộ menu cũ
  chrome.contextMenus.removeAll();

  // Thêm menu cố định
  chrome.contextMenus.create({
    id: NEW_CHAT_CONTEXT_MENU_ID,
    title: "New chat",
    contexts: ["all"]
  });

  // Thêm menu mới
  const features = await db.get('features') || [];
  
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
  // if (info.menuItemId === OPEN_OPTIONS_CONTEXT_MENU_ID) {
  //   chrome.runtime.openOptionsPage();
  //   return;
  // }

  if (tab?.id) {
    let markdownContent = info.selectionText;

    try {
      // Gửi message đến content script
      markdownContent = await chrome.tabs.sendMessage(tab.id, {
        action: 'getSelectedHTML',
        selectionText: info.selectionText
      });
    } catch (error) {
      console.error('Lỗi khi gửi message đến content script:', error);
    }

    if (!markdownContent) {
      markdownContent = info.selectionText;
    }

    // Lưu markdown content
    await db.set('menuItemId', info.menuItemId);
    await db.set('chromeContextMenuSelectedMarkdownContent', markdownContent);     

    try {
      // Mở cửa sổ chat
      try {
        chrome.system.display.getInfo((displays) => {
          const primaryDisplay = displays.find(d => d.isPrimary);
          if (!primaryDisplay) {
            console.error('Không tìm thấy màn hình chính');
            return;
          }

          const screenWidth = primaryDisplay.workArea.width;
          const screenHeight = primaryDisplay.workArea.height;
          const width = Math.floor(screenWidth * 1);
          const height = Math.floor(screenHeight * 1);

          chrome.windows.create({
            url: 'index.html',
            type: 'popup',
            width,
            height,
            left: Math.floor((screenWidth - width) / 2),
            top: Math.floor((screenHeight - height) / 2)
          });
        });
      } catch (error) {
        chrome.windows.create({
          url: 'index.html',
          type: 'popup',
          width: 800,
          height: 800
        });
      }
    } catch (error) {
      console.error('Lỗi khi mở window:', error);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateContextMenu') {
    updateContextMenu().then(() => sendResponse({ success: true }));
    return true; // Giữ kết nối mở để gửi response
  } 
  // else if(message.ation === OPEN_OPTIONS_CONTEXT_MENU_ID){
  //   chrome.runtime.openOptionsPage();
  // }
});