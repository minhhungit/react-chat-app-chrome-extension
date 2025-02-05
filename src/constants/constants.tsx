export const NEW_CHAT_CONTEXT_MENU_ID = "newChat";
export const OPEN_OPTIONS_CONTEXT_MENU_ID = "openOptions";

export const SETTING_EXPLANATIONS = {
    temperature: "Điều chỉnh mức độ sáng tạo của model. Giá trị càng cao, kết quả càng ngẫu nhiên. Ví dụ, tăng temperature giúp model tạo ra câu trả lời độc đáo hơn nhưng có thể rủi ro hơn. Thông thường, giá trị này nằm trong khoảng từ 0.2 đến 1.5. Ví dụ, nếu đặt temperature là 0.5, model sẽ tạo ra câu trả lời vừa phải về mặt sáng tạo.",
    max_tokens: "Giới hạn số lượng từ trong câu trả lời. Giá trị càng cao, câu trả lời càng dài. Tuy nhiên, điều này cũng tiêu tốn nhiều tài nguyên hơn. Thông thường, giá trị này nằm trong khoảng từ 100 đến 1000. Ví dụ, nếu đặt max_tokens là 200, câu trả lời sẽ có độ dài vừa phải, khoảng 2-3 câu.",
    top_p: "Kiểm soát tính đa dạng của kết quả. Giá trị thấp sẽ tập trung vào các từ phổ biến, trong khi giá trị cao cho phép kết quả đa dạng hơn. Ví dụ, nếu đặt top_p là 0.5, model sẽ chọn từ trong top 50% từ có xác suất cao nhất. Thông thường, giá trị này nằm trong khoảng từ 0.1 đến 0.9.",
    frequency_penalty: "Giảm tần suất lặp lại từ. Giá trị dương sẽ giảm lặp từ, giúp câu trả lời đa dạng hơn. Ví dụ, nếu đặt frequency_penalty là 0.5, model sẽ giảm 50% tần suất lặp lại từ. Thông thường, giá trị này nằm trong khoảng từ 0 đến 1.",
    presence_penalty: "Khuyến khích sử dụng từ mới. Giá trị dương sẽ tăng từ mới, giúp câu trả lời phong phú hơn. Ví dụ, nếu đặt presence_penalty là 0.5, model sẽ tăng 50% khả năng chọn từ chưa dùng. Thông thường, giá trị này nằm trong khoảng từ 0 đến 1.",
    model: "Chọn model AI phù hợp với nhu cầu sử dụng. Mỗi model có điểm mạnh và điểm yếu riêng, vì vậy việc chọn model đúng sẽ ảnh hưởng đến chất lượng và tốc độ.",
    apiKey: "Khóa API để xác thực với nhà cung cấp dịch vụ AI. Giữ bí mật apiKey là rất quan trọng để tránh bị lợi dụng. Ví dụ, nếu apiKey là 'sk-abc-xyz', người dùng cần giữ bí mật và không chia sẻ với người khác.",
    apiUrl: "Địa chỉ API endpoint của nhà cung cấp dịch vụ AI. Cấu trúc apiUrl đúng cách là rất quan trọng để đảm bảo kết nối thành công."
  };