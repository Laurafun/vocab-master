/**
 * 简化版 - 暂时不需要审核，所有学生直接可用
 * 数据存在 localStorage，老师后台通过 GitHub API 读取
 */

import { handleCorrect, handleWrong, FORGETTING_CURVE_DATA, SPACED_REPETITION_EFFECT, BOX_DESCRIPTIONS, BOX_COLORS } from './lib/spaced-repetition';
import BUILT_IN_WORDS from './lib/built-in-words';

export async function reportProgress(studentId: string, studentName: string, stats: any) {
  // 暂时不实现
}

export async function getAllStudents(): Promise<any[]> {
  return [];
}

export async function checkStudentStatus(studentId: string): Promise<'pending' | 'approved' | 'rejected' | 'unknown'> {
  return 'approved';
}

export async function registerStudent(studentId: string, studentName: string): Promise<'pending' | 'approved' | 'rejected'> {
  return 'approved';
}

export async function approveStudent(studentId: string): Promise<boolean> {
  return true;
}

export async function rejectStudent(studentId: string): Promise<boolean> {
  return true;
}