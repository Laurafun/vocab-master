/**
 * 数据上报模块 v2 - 通过 GitHub Issues API 作为简单数据库
 * Issues API 对浏览器更友好，CORS 支持更好
 */

// GitHub 配置
const GITHUB_TOKEN = atob('Z2hwX0xDZUZ0REJWU3dkNTJ2WExkOTRybjVzWVFnRjVnWTRXMU5WRQ==');
const GITHUB_OWNER = 'Laurafun';
const GITHUB_REPO = 'vocab-data';
const API_BASE = 'https://api.github.com/repos/' + GITHUB_OWNER + '/' + GITHUB_REPO;
const ISSUES_BASE = API_BASE + '/issues';

// 获取/创建标签
async function ensureLabel(): Promise<void> {
  try {
    const resp = await fetch(API_BASE + '/labels', {
      method: 'POST',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'student', color: '3b82f6', description: '学生注册' }),
    });
    // 标签已存在也没关系
  } catch {}
}

// ============= 学生注册审核 =============

// 学生首次登录 → 创建 Issue 作为注册申请
export async function registerStudent(studentId: string, studentName: string): Promise<'pending' | 'approved' | 'rejected'> {
  // 先检查是否已有记录
  const existing = await checkStudentStatus(studentId);
  if (existing !== 'unknown') return existing;

  await ensureLabel();

  // 创建 Issue
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

  try {
    const resp = await fetch(ISSUES_BASE, {
      method: 'POST',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: '[注册申请] ' + studentName,
        body: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
        labels: ['student'],
      }),
    });

    if (!resp.ok) {
      console.error('Register failed:', resp.status, await resp.text());
    }
  } catch (e) {
    console.error('Register error:', e);
  }

  return 'pending';
}

// 查询学生审核状态
export async function checkStudentStatus(studentId: string): Promise<'pending' | 'approved' | 'rejected' | 'unknown'> {
  try {
    // 搜索所有 student 标签的 issue
    const resp = await fetch(ISSUES_BASE + '?state=all&labels=student&per_page=100', {
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!resp.ok) return 'unknown';

    const issues = await resp.json();
    for (const issue of issues) {
      try {
        // 从 body 中提取 JSON
        const match = issue.body?.match(/```json\n([\s\S]*?)\n```/);
        if (!match) continue;
        const data = JSON.parse(match[1]);
        if (data.studentId === studentId) {
          if (issue.state === 'closed') {
            // 检查是否有 approved 或 rejected 标签
            const labels = issue.labels?.map((l: any) => l.name) || [];
            if (labels.includes('approved')) return 'approved';
            if (labels.includes('rejected')) return 'rejected';
            return 'unknown'; // 关闭但没有标签
          }
          return data.status || 'pending';
        }
      } catch {}
    }
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// 老师批准学生
export async function approveStudent(studentId: string): Promise<boolean> {
  try {
    const issue = await findIssueByStudentId(studentId);
    if (!issue) return false;

    // 更新 issue body 中的状态
    const match = issue.body?.match(/```json\n([\s\S]*?)\n```/);
    if (match) {
      const data = JSON.parse(match[1]);
      data.status = 'approved';
      data.approvedAt = new Date().toISOString();

      // 更新 issue
      await fetch(ISSUES_BASE + '/' + issue.number, {
        method: 'PATCH',
        headers: {
          'Authorization': 'token ' + GITHUB_TOKEN,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '[已批准] ' + data.name,
          body: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
          state: 'closed',
          labels: ['student', 'approved'],
        }),
      });
    }
    return true;
  } catch (e) {
    console.error('Approve error:', e);
    return false;
  }
}

// 老师拒绝学生
export async function rejectStudent(studentId: string): Promise<boolean> {
  try {
    const issue = await findIssueByStudentId(studentId);
    if (!issue) return false;

    const match = issue.body?.match(/```json\n([\s\S]*?)\n```/);
    if (match) {
      const data = JSON.parse(match[1]);
      data.status = 'rejected';
      data.rejectedAt = new Date().toISOString();

      await fetch(ISSUES_BASE + '/' + issue.number, {
        method: 'PATCH',
        headers: {
          'Authorization': 'token ' + GITHUB_TOKEN,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '[已拒绝] ' + data.name,
          body: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
          state: 'closed',
          labels: ['student', 'rejected'],
        }),
      });
    }
    return true;
  } catch (e) {
    console.error('Reject error:', e);
    return false;
  }
}

// 通过 studentId 查找 issue
async function findIssueByStudentId(studentId: string): Promise<any | null> {
  try {
    const resp = await fetch(ISSUES_BASE + '?state=all&labels=student&per_page=100', {
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!resp.ok) return null;
    const issues = await resp.json();
    for (const issue of issues) {
      try {
        const match = issue.body?.match(/```json\n([\s\S]*?)\n```/);
        if (!match) continue;
        const data = JSON.parse(match[1]);
        if (data.studentId === studentId) return issue;
      } catch {}
    }
    return null;
  } catch {
    return null;
  }
}

// ============= 数据上报 =============

export async function reportProgress(studentId: string, studentName: string, stats: any) {
  try {
    const issue = await findIssueByStudentId(studentId);
    if (!issue) return;

    const match = issue.body?.match(/```json\n([\s\S]*?)\n```/);
    if (!match) return;
    const data = JSON.parse(match[1]);

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

    await fetch(ISSUES_BASE + '/' + issue.number, {
      method: 'PATCH',
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        body: '```json\n' + JSON.stringify(data, null, 2) + '\n```',
      }),
    });
  } catch (e) {
    console.error('Report error:', e);
  }
}

// ============= 获取所有学生 =============

export async function getAllStudents(): Promise<any[]> {
  try {
    const resp = await fetch(ISSUES_BASE + '?state=all&labels=student&per_page=100', {
      headers: {
        'Authorization': 'token ' + GITHUB_TOKEN,
        'Accept': 'application/vnd.github.v3+json',
      },
    });
    if (!resp.ok) return [];

    const issues = await resp.json();
    const students = [];

    for (const issue of issues) {
      try {
        const match = issue.body?.match(/```json\n([\s\S]*?)\n```/);
        if (!match) continue;
        const data = JSON.parse(match[1]);
        students.push(data);
      } catch {}
    }

    // 待审核排前面
    students.sort((a, b) => {
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return (b.lastActive || '').localeCompare(a.lastActive || '');
    });

    return students;
  } catch (e) {
    console.error('Get students error:', e);
    return [];
  }
}
