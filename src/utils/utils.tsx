/**
 * Tạo chuỗi ngẫu nhiên độ dài chỉ định chỉ chứa các ký tự [a-z]
 * @param length Độ dài chuỗi mong muốn
 * @returns Chuỗi ngẫu nhiên
 */
export const generateRandomString = (length: number): string => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz';
  const charactersLength = characters.length;
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  
  return result;
};
