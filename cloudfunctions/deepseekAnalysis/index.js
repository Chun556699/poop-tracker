// cloudfunctions/deepseekAnalysis/index.js
const cloud = require('wx-server-sdk');
const axios = require('axios');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 默认 DeepSeek 聊天补全接口地址
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

/**
 * 云函数入口
 * event.records - 前端抓取并传入的最近 7 天或特定阶段的排便记录列表
 */
exports.main = async (event, context) => {
  const { records } = event;
  
  // 微信云开发控制台中配置的环境变量
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn('云函数未检测到 DEEPSEEK_API_KEY，启用本地优雅降级数据返回');
    return {
      success: false,
      error: '环境变量 DEEPSEEK_API_KEY 未配置，请在云控制台完成配置。',
      mockReport: generateMockReport(records)
    };
  }

  if (!records || records.length === 0) {
    return {
      success: false,
      error: '未传入任何排便监测记录，无法生成分析评估。'
    };
  }

  // 1. 数据结构化并精简化拼装，节省上下文 token
  const formattedRecordsStr = formatRecordsForLLM(records);

  // 2. 编写极其详尽、拟人有温度的 System Prompt
  const systemPrompt = `你是一位资深的肠道健康管理专家与营养医学顾问。你的语气应该温暖、科学、令人安心，像一位体贴、富有耐心的私人家庭医生。
用户会向你提供过去一周的排便监测数据（包括日期时刻、持续时长、布里斯托性状分类、备注感受等）。
请你对用户的数据进行科学、系统的分析并生成报告，报告应包含以下几个模块，请使用清晰的 Markdown 标题输出：

### 📋 整体状况评估
- 简述最近的排便频次（评估是否符合规律），平均时长（若单次普遍超过10分钟，温柔提醒注意排便习惯，防止痔疮或便秘）。
- 分析便便性状构成，重点解读最主要的布里斯托形状分类对应的健康指征。

### 🔍 潜在成因探究
- 结合用户的具体备注（如吃辣、熬夜、运动少、不适感），分析导致目前排便波动、便秘或腹泻的可能生活方式成因。如果没有备注，可以根据排便表现推测合理的诱因。

### 🥗 温暖的改善建议
- 给出非常具体、可落地的改善步骤（如补水量、膳食纤维搭配、具体食物推荐、建议的最佳排便时刻、简单的腹部按摩方法等）。

### ⚠️ 专业免责声明
- 用温和的语气声明：本报告由 AI 生成，仅供日常健康参考，不构成医疗诊断或临床建议。若伴有长期不适、腹痛、便血等，请务必及时去医院就诊。

请保持排版工整，多用列表和精简文字，不要有冗长的废话，整体字数控制在 500-800 字。`;

  const userPrompt = `这是我过去一周的肠道排便记录：
  
${formattedRecordsStr}

请为我生成专属的健康分析报告与建议。`;

  try {
    const response = await axios({
      method: 'post',
      url: DEEPSEEK_API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      data: {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      },
      timeout: 45000 // 对接大模型，45秒网络接口连接超时
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      const content = response.data.choices[0].message.content;
      return {
        success: true,
        report: content
      };
    } else {
      throw new Error('DeepSeek 接口没有返回有效的文本数据。');
    }

  } catch (err) {
    console.error('云函数调用 DeepSeek 出错:', err);
    return {
      success: false,
      error: `接口连接异常: ${err.message}`,
      mockReport: generateMockReport(records) // 接口报错或超时也保障用户体验，给出精致拟合的评估
    };
  }
};

// 格式化记录，便于大模型分析
function formatRecordsForLLM(records) {
  const bristolDesc = {
    1: '1型：散状硬球 (严重便秘)',
    2: '2型：凹凸腊肠 (轻微便秘)',
    3: '3型：裂纹腊肠 (稍干/正常)',
    4: '4型：光滑香蕉 (完美黄金状态)',
    5: '5型：软质断块 (膳食纤维偏少)',
    6: '6型：糊状泥状 (轻微腹泻)',
    7: '7型：水样无固体 (严重腹泻)'
  };

  return records.map((r, i) => {
    return `${i + 1}. [日期时刻] ${r.date} ${r.time} | [排便时长] ${r.duration}分钟 | [便便性状] ${bristolDesc[r.bristolType] || r.bristolType} | [备注感受] ${r.notes || '无'}`;
  }).join('\n');
}

// 优雅的本地降级生成算法，若无 API Key 或网络中断时自动生成的智能分析报告
function generateMockReport(records) {
  const typeCounts = {};
  let totalDuration = 0;
  let healthyCount = 0;
  
  records.forEach(r => {
    typeCounts[r.bristolType] = (typeCounts[r.bristolType] || 0) + 1;
    totalDuration += r.duration || 0;
    if (r.bristolType === 3 || r.bristolType === 4) healthyCount++;
  });

  let mainType = 4;
  let maxCount = 0;
  for (const t in typeCounts) {
    if (typeCounts[t] > maxCount) {
      maxCount = typeCounts[t];
      mainType = parseInt(t, 10);
    }
  }

  const avgDuration = Math.round(totalDuration / records.length);
  const healthyPct = Math.round((healthyCount / records.length) * 100);

  let assessText = '';
  let causeText = '';
  let adviseText = '';

  if (mainType <= 2) {
    assessText = `您的排便形状本周主要集中在 **${mainType}型（散状硬球/凹凸腊肠）**，表明存在较为明显的**便秘指征**。平均单次时长为 **${avgDuration}分钟**，${avgDuration > 8 ? '排便耗时相对较长，肠道收缩略显无力，建议排便时远离手机以缩短直肠受压时长。' : '排便阻力较大，需要用力。'}`;
    causeText = `硬球或干硬结块多由身体摄水量不足、主食过细缺乏谷物膳食纤维、平时身体缺乏伸展蠕动导致。`;
    adviseText = `- **黄金补水公式**：建议每日主动分次摄入 1800-2000ml 温水，晨起第一杯温水特别有助于建立排便反射。
- **高纤维饮食结构**：每日多吃燕麦、菠菜、西梅干、火豆等富含可溶纤维的蔬果。
- **规律定时**：早餐后 10 分钟或睡前定时蹲厕 5 分钟，养成习惯。`;
  } else if (mainType >= 6) {
    assessText = `您的便便在本周中偏向 **${mainType}型（糊状泥状/水样液体）**，表明肠蠕动亢进或伴有**消化不适、轻微腹泻**，黄金比例仅为 **${healthyPct}%**。`;
    causeText = `质地过软或稀水便多由肠胃着凉、冰镇刺激饮食、油辣重油、或肠道微生态暂时失衡诱发。`;
    adviseText = `- **温热易消化膳食**：优先选择小米南瓜粥、软烂挂面、去皮蒸苹果，少吃冰冷刺激和高油食物。
- **补充微量电解质**：腹泻极易导致水分和钾钠离子流失，可适当补充温热淡盐水。
- **腹部物理防凉**：空调房中注意腹部保暖。`;
  } else {
    assessText = `恭喜您！您的排便主要以 **${mainType}型（完美的黄金香蕉状）** 为主，黄金健康便便占比达到极高的 **${healthyPct}%**。排便平均耗时仅 **${avgDuration}分钟**，说明肠胃蠕动规律且顺畅。`;
    causeText = `这表明您当前的膳食习惯、水分摄入以及心情状态都处于非常契合的黄金状态，继续保持！`;
    adviseText = `- **保持膳食多样性**：均衡摄入蛋白质、多纤维蔬菜和谷物，维持良好的肠道微生物生态。
- **温和有氧运动**：建议配合每天散步 20 分钟，持之以恒，肠胃更年轻。`;
  }

  return `### 📋 整体状况评估
- **排便频次**：最近 7 天共记录排便 **${records.length}** 次。${records.length >= 4 ? '频次规律，保持良好。' : '频次偏少，如有胃胀、腹胀感请多留意。'}
- **排便时长**：单次平均用时 **${avgDuration} 分钟**。
- **完美黄金比例**：**${healthyPct}%**。
- **排便性状主导分析**：${assessText}

### 🔍 潜在成因探究
- ${causeText}
- ${records.some(r => r.notes) ? '结合您的个人随笔记录，最近可能面临饮食油腻吃辣、久坐或冷热刺激。' : '此外，不规律的作息、换季温差变化以及工作学习压力也会引起消化系统反射。'}

### 🥗 温暖的改善建议
${adviseText}
- **腹部顺时针按摩法**：每天平躺后，手掌温热，以肚脐为中心顺时针轻揉 50 次，帮助大肠传输。

### ⚠️ 专业免责声明
- *温馨提醒：本报告由智能健康分析对比产生，仅供日常家庭消化保健康复指南使用。如果您面临长期的腹泻不止、剧烈腹痛、脓血黏液或排便习惯极度改变，请务必前往消化内科诊疗。*`;
}
