// config.example.js
// 复制此文件为 config.js 并填入你的真实 API Key
// 注意：config.js 已在 .gitignore 中，不会提交到 GitHub
module.exports = {
  // 前往 https://platform.deepseek.com/ 注册获取 API Key
  DEEPSEEK_API_KEY: 'sk-your-deepseek-api-key-here',

  // DeepSeek 模型选择
  DEEPSEEK_MODEL: 'deepseek-v4-flash',

  // DeepSeek API 接口端点
  DEEPSEEK_API_URL: 'https://api.deepseek.com/chat/completions'
};
