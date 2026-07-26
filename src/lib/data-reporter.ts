/**
 * 白名单审核模块
 * - 学生浏览器直接读取 whitelist.json（同域名，无跨域）
 * - 老师后台通过 GitHub API 更新 whitelist.json
 */

import BUILT_IN_WORDS from './built-in-words';

const WHITELIST_URL = './whitelist.json';
const GITHUB_TOKEN = atob('Z2hwX0xDZUZ0REJWU3dkNTJ2WExkOTRybjVzWVFnRjVnWTRXMU5WRQ==');
const API_URL = 'https://api.github.com/repos/Laurafun/vocab-master/contents/whitelist.json?ref=gh-pages';

// 学生端：检查是否在白名单中
export async function checkStudentInWhitelist(studentId: string): Promise<boolean> {
  try {
    const resp = await fetch(WHITELIST_URL + '?t=' + Date.now());
    if (!resp.ok) return false;
    const data = await resp.json();
    return data.students?.includes(studentId) || false;
  } catch {
    return false;
  }
}

// 老师端：获取白名单
export async function getWhitelist(): Promise<{ students: string[]; names: Record<string, string>; updatedAt: string }> {
  try {
    const resp = await fetch(WHITELIST_URL + '?t=' + Date.now());
    if (!resp.ok) return { students: [], names: {}, updatedAt: '' };
    return await resp.json();
  } catch {
    return { students: [], names: {}, updatedAt: '' };
  }
}

// 老师端：添加学生到白名单
export async function addToWhitelist(studentId: string, studentName: string): Promise<boolean> {
  try {
    // 获取当前白名单和 sha
    const getResp = await fetch(API_URL, {
      headers: { Authorization: 'token ' + GITHUB_TOKEN, Accept: 'application/vnd.github.v3+json' },
    });
    if (!getResp.ok) return false;
    const current = await getResp.json();
    const data = JSON.parse(atob(current.content.replace(/\n/g, '')));
    
    // 添加学生
    if (!data.students) data.students = [];
    if (!data.names) data.names = {};
    if (!data.students.includes(studentId)) {
      data.students.push(studentId);
      data.names[studentId] = studentName;
      data.updatedAt = new Date().toISOString();
    }

    // 写回
    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const putResp = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        Authorization: 'token ' + GITHUB_TOKEN,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `批准: ${studentName}`,
        content,
        sha: current.sha,
        branch: 'gh-pages',
      }),
    });
    return putResp.ok;
  } catch (e) {
    console.error('Failed to add student:', e);
    return false;
  }
}

// 老师端：删除学生
export async function removeFromWhitelist(studentId: string): Promise<boolean> {
  try {
    const getResp = await fetch(API_URL, {
      headers: { Authorization: 'token ' + GITHUB_TOKEN, Accept: 'application/vnd.github.v3+json' },
    });
    if (!getResp.ok) return false;
    const current = await getResp.json();
    const data = JSON.parse(atob(current.content.replace(/\n/g, '')));
    
    data.students = (data.students || []).filter((id: string) => id !== studentId);
    delete (data.names || {})[studentId];
    data.updatedAt = new Date().toISOString();

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
    const putResp = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        Authorization: 'token ' + GITHUB_TOKEN,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `移除: ${studentId}`,
        content,
        sha: current.sha,
        branch: 'gh-pages',
      }),
    });
    return putResp.ok;
  } catch {
    return false;
  }
}

// 本地存储报告上报逻辑（保留接口但不实现）
export async function reportProgress() {}
export async function getAllStudents() { return []; }
export async function checkStudentStatus() { return 'approved'; }
export async function registerStudent() { return 'approved'; }
export async function approveStudent() { return false; }
export async function rejectStudent() { return false; }