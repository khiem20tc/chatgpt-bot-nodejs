const {Configuration, OpenAIApi} = require("openai");
const DbService = require('./db.service');

class ChatGPTService {
  rolePlayIntroduction = '';
  async generateCompletion(prompt, user) {
    // Lấy đống tin nhắn cũ ra
    const oldMessages = await DbService.getUserMessages(user._id);

    // Load key từ file environment
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_KEY,
    });
    const openai = new OpenAIApi(configuration);

    let fullPrompt = this.rolePlayIntroduction + '\n\n';

    if (oldMessages && oldMessages.length > 0) {
      fullPrompt += 'CHAT:\n';
      // nếu có tin nhắn cũ thì thêm đoạn tin nhắn cũ đấy vào nội dung chat
      for (let message of oldMessages) {
        fullPrompt += `User: ${message.userMessage}\n`;
        fullPrompt += `Bot: ${message.botMessage}\n\n`;
      }
    }

    fullPrompt += `User: ${prompt}\n`;
    fullPrompt += `Bot: `;

    console.log(fullPrompt);

    // Gửi request về OpenAI Platform để tạo text completion
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: fullPrompt,
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    // Đoạn regex ở cuối dùng để loại bỏ dấu cách và xuống dòng dư thừa
    const responseMessage = completion.data.choices[0].text.replace(/^\s+|\s+$/g, "");

    // Lưu lại tin nhắn vào Database
    await DbService.createNewMessage(user, prompt, responseMessage);
    return responseMessage;
  }
}

module.exports = new ChatGPTService();
