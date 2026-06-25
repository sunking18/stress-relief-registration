const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'submissions.json');

// 确保数据文件存在
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

// 读取所有报名数据
function readSubmissions() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

// 保存报名数据
function saveSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 提交报名
app.post('/api/submit', (req, res) => {
  const { name, phone, wechat, gender, age, occupation, stress, sources, experience, diagnosis, expectation, photo, agreement } = req.body;

  // 验证必填字段
  if (!name || !phone || !wechat || !gender || !age || !occupation || !stress || !experience || !photo || !agreement) {
    return res.json({ success: false, message: '请填写所有必填字段' });
  }
  if (agreement !== '同意') {
    return res.json({ success: false, message: '请同意保密协议' });
  }

  const submissions = readSubmissions();
  const newEntry = {
    id: submissions.length + 1,
    name,
    phone,
    wechat,
    gender,
    age,
    occupation,
    stress,
    sources: sources || '',
    experience,
    diagnosis: diagnosis || '',
    expectation: expectation || '',
    photo,
    agreement,
    submittedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  };

  submissions.push(newEntry);
  saveSubmissions(submissions);

  res.json({ success: true, message: '报名成功！' });
});

// 获取所有报名数据
app.get('/api/submissions', (req, res) => {
  const submissions = readSubmissions();
  res.json({ success: true, data: submissions, total: submissions.length });
});

// 导出CSV
app.get('/api/export/csv', (req, res) => {
  const submissions = readSubmissions();
  
  const headers = ['序号', '姓名', '手机号', '微信号', '性别', '年龄段', '职业', '压力程度', '压力来源', '团辅经历', '诊断史', '活动期待', '拍照授权', '保密协议', '提交时间'];
  
  let csv = '\uFEFF' + headers.join(',') + '\n';
  
  submissions.forEach(s => {
    const row = [
      s.id,
      `"${s.name}"`,
      `"${s.phone}"`,
      `"${s.wechat || ''}"`,
      `"${s.gender}"`,
      `"${s.age}"`,
      `"${s.occupation}"`,
      s.stress,
      `"${s.sources || ''}"`,
      `"${s.experience}"`,
      `"${s.diagnosis || ''}"`,
      `"${s.expectation || ''}"`,
      `"${s.photo}"`,
      `"${s.agreement}"`,
      `"${s.submittedAt}"`
    ];
    csv += row.join(',') + '\n';
  });

  const dateStr = new Date().toISOString().slice(0,10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="signups_${dateStr}.csv"`);
  res.send(csv);
});

// 导出JSON
app.get('/api/export/json', (req, res) => {
  const submissions = readSubmissions();
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="signups_${dateStr}.json"`);
  res.json(submissions);
});

app.listen(PORT, () => {
  console.log(`\n🌿 报名系统已启动！`);
  console.log(`──────────────────────`);
  console.log(`📝 报名页面:  http://localhost:${PORT}`);
  console.log(`📊 管理后台:  http://localhost:${PORT}/admin.html`);
  console.log(`📋 保密协议:  http://localhost:${PORT}/协议.html`);
  console.log(`──────────────────────`);
  console.log(`按 Ctrl+C 停止服务`);
});
