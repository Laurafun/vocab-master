/**
 * 数据上报模块 - 通过 GitHub API 把学生进度上报到私有仓库
 * 包含学生注册审核功能
 */

// GitHub 配置
const GITHUB_TOKEN = atob('Z2hwX0xDZUZ0REJWU3dkNTJ2WExkOTRybjVzWVFnRjVnWTRXMU5WRQ==');
const GITHUB_OWNER = 'Laurafun';
const GITHUB_REPO = 'vocab-data';
const API_BASE = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO;

// 上报间隔
let lastReportTime = 0;
const REPORT_INTERVAL = 30000;

// 写入或更新文件
async function writeToFile(path: string, content: string, sha?: string): Promise<boolean> {
  try {
    const resp = await fetch(API_BASE + '/contents/' + path, {
      method: 'PUT',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Update ' + path,
        content: btoa(unescape(encodeURIComponent(content))),
        sha: sha,
      }),
    });
    return resp.ok;
  } catch (e) {
    console.error('Report failed:', e);
    return false;
  }
}

// 读取文件
async function readFromFile(path: string): Promise<{ content: string; sha: string } | null> {
  try {
    const resp = await fetch(API_BASE + '/contents/' + path, {
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const content = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    return { content, sha: data.sha };
  } catch {
    return null;
  }
}

// 列出目录下所有文件
async function listFiles(path: string): Promise<string[]> {
  try {
    const resp = await fetch(API_BASE + '/contents/' + path, {
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data.map((f: any) => f.name);
  } catch {
    return [];
  }
}

// ============= 学生注册审核 =============

// 学生首次登录 → 创建注册申请（状态 pending）
export async function registerStudent(studentId: string, studentName: string): Promise<'pending' | 'approved' | 'rejected'> {
  const filePath = 'students/' + studentId + '.json';
  const existing = await readFromFile(filePath);

  if (existing) {
    try {
      const data = JSON.parse(existing.content);
      // 返回已有的状态（不自动批准）
      return data.status || 'pending';
    } catch {}
  }

  // 新学生 → 创建待审核记录
  const data = {
    studentId,
    name: studentName,
    status: 'pending',
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString(),
    totalWords: 0, newWords: 0, learning: 0, mastered: 0, dueToday: 0,
    todayStats: { total: 0, correct: 0, wrong: 0 },
    streak: 0,
  };

  // 尝试写入，最多重试 3 次
  let success = false;
  for (let i = 0; i < 3; i++) {
    success = await writeToFile(filePath, JSON.stringify(data, null, 2));
    if (success) break;
    await new Promise(r => setTimeout(r, 1000)); // 等 1 秒重试
  }

  // 无论是否写入成功，都返回 pending（学生看到等待页面）
  // 如果写入失败，下次打开会重试
  return 'pending';
}

// 查询学生审核状态
export async function checkStudentStatus(studentId: string): Promise<'pending' | 'approved' | 'rejected' | 'unknown'> {
  const result = await readFromFile('students/' + studentId + '.json');
  if (!result) return 'unknown';
  try {
    const data = JSON.parse(result.content);
    return data.status || 'pending';
  } catch {
    return 'unknown';
  }
}

// 老师批准学生
export async function approveStudent(studentId: string): Promise<boolean> {
  const filePath = 'students/' + studentId + '.json';
  const existing = await readFromFile(filePath);
  if (!existing) return false;

  try {
    const data = JSON.parse(existing.content);
    data.status = 'approved';
    data.approvedAt = new Date().toISOString();
    return await writeToFile(filePath, JSON.stringify(data, null, 2), existing.sha);
  } catch {
    return false;
  }
}

// 老师拒绝学生
export async function rejectStudent(studentId: string): Promise<boolean> {
  const filePath = 'students/' + studentId + '.json';
  const existing = await readFromFile(filePath);
  if (!existing) return false;

  try {
    const data = JSON.parse(existing.content);
    data.status = 'rejected';
    data.rejectedAt = new Date().toISOString();
    return await writeToFile(filePath, JSON.stringify(data, null, 2), existing.sha);
  } catch {
    return false;
  }
}

// ============= 数据上报 =============

export async function reportProgress(studentId: string, studentName: string, stats: any) {
  const now = Date.now();
  if (now - lastReportTime < REPORT_INTERVAL) return;
  lastReportTime = now;

  const filePath = 'students/' + studentId + '.json';
  const existing = await readFromFile(filePath);
  if (!existing) return; // 文件不存在则不上报

  try {
    const data = JSON.parse(existing.content);
    // 只有已批准的学生才更新进度
    if (data.status !== 'approved') return;

    data.totalWords = stats.total || 0;
    data.newWords = stats.newWords || 0;
    data.learning = stats.learning || 0;
    data.mastered = stats.mastered || 0;
    data.dueToday = stats.dueToday || 0;
    data.todayStats = stats.todayStats || { total: 0, correct: 0, wrong: 0 };
    data.streak = stats.streak || 0;
    data.lastActive = new Date().toISOString();

    await writeToFile(filePath, JSON.stringify(data, null, 2), existing.sha);
  } catch {}
}

// ============= 获取所有学生 =============

export async function getAllStudents(): Promise<any[]> {
  const files = await listFiles('students');
  const students = [];

  for (const file of files) {
    const result = await readFromFile('students/' + file);
    if (result) {
      try {
        students.push(JSON.parse(result.content));
      } catch {}
    }
  }

  // 待审核排前面，然后按最后活跃时间排序
  students.sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return (b.lastActive || '').localeCompare(a.lastActive || '');
  });
  return students;
}
