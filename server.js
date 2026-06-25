const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3456;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');

// 确保 data 目录和数据文件存在
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

function readSubmissions() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveSubmissions(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/submit', (req, res) => {
  const { name, phone, wechat, gender, age, occupation, stress, sources, experience, diagnosis, expectation, photo, agreement } = req.body;
  if (!name || !phone || !wechat || !gender || !age || !occupation || !stress || !experience || !photo || !agreement) {
    return res.json({ success: false, message: '请填写所有必填字段' });
  }
  if (agreement !== '同意') {
    return res.json({ success: false, message: '请同意保密协议' });
  }
  const list = readSubmissions();
  list.push({
    id: list.length + 1, name, phone, wechat, gender, age, occupation, stress,
    sources: sources || '', experience, diagnosis: diagnosis || '',
    expectation: expectation || '', photo, agreement,
    submittedAt: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })
  });
  saveSubmissions(list);
  res.json({ success: true, message: '报名成功！' });
});

app.get('/api/submissions', (req, res) => {
  res.json({ success: true, data: readSubmissions(), total: 0 });
});

app.get('/api/export/csv', (req, res) => {
  const list = readSubmissions();
  const h = '序号,姓名,手机号,微信号,性别,年龄段,职业,压力程度,压力来源,团辅经历,诊断史,活动期待,拍照授权,保密协议,提交时间';
  let csv = '\uFEFF' + h + '\n';
  list.forEach(s => {
    csv += [s.id, `"${s.name}"`, `"${s.phone}"`, `"${s.wechat||''}"`, `"${s.gender}"`, `"${s.age}"`, `"${s.occupation}"`, s.stress, `"${s.sources||''}"`, `"${s.experience}"`, `"${s.diagnosis||''}"`, `"${s.expectation||''}"`, `"${s.photo}"`, `"${s.agreement}"`, `"${s.submittedAt}"`].join(',') + '\n';
  });
  const d = new Date().toISOString().slice(0,10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="signups_${d}.csv"`);
  res.send(csv);
});

app.listen(PORT, () => {
  console.log(`\n🌿 报名系统已启动！ http://localhost:${PORT}`);
});
