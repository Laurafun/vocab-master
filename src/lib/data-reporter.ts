/**
 * 数据上报模块 - 通过 GitHub API 把学生进度上报到私有仓库
 * 老师 can 在后台查看所有学生数据
 */

// GitHub 配置
const GITHUB_TOKEN = atob('Z2hwX0xDZUZ0REJWU3dkNTJ2WExkOTRybjVzWVFnRjVnWTRXMU5WRQ==');
const GITHUB_OWNER = 'Laurafun';
const GITHUB_REPO = 'vocab-data';
const API_BASE = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO;

// 上报间隔（避免频繁请求）
let lastReportTime = 0;
const REPORT_INTERVAL = 30000; // 30 秒最多上报一次

// 写入或更新文件到 GitHub
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

// 上报学生进度
export async function reportProgress(studentId: string, studentName: string, stats: any) {
  const now = Date.now();
  if (now - lastReportTime < REPORT_INTERVAL) return; // 限流
  lastReportTime = now;

  const fileName = studentId + '.json';
  const filePath = 'students/' + fileName;

  // 先获取现有文件（获取 sha）
  const existing = await readFromFile(filePath);

  const data = {
    studentId,
    name: studentName,
    totalWords: stats.total || 0,
    newWords: stats.newWords || 0,
    learning: stats.learning || 0,
    mastered: stats.mastered || 0,
    dueToday: stats.dueToday || 0,
    todayStats: stats.todayStats || { total: 0, correct: 0, wrong: 0 },
    streak: stats.streak || 0,
    lastActive: new Date().toISOString(),
  };

  await writeToFile(filePath, JSON.stringify(data, null, 2), existing?.sha);
}

// 获取所有学生数据（老师后台用）
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

  // 按最后活跃时间排序
  students.sort((a, b) => (b.lastActive || '').localeCompare(a.lastActive || ''));
  return students;
}
