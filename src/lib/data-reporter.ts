/**
 * 所有人直接可用，无需审核
 */

export async function checkStudentInWhitelist(): Promise<boolean> { return true; }
export async function getWhitelist() { return { students: [], names: {}, updatedAt: '' }; }
export async function addToWhitelist(): Promise<boolean> { return false; }
export async function removeFromWhitelist(): Promise<boolean> { return false; }
export async function reportProgress() {}
export async function getAllStudents() { return []; }
export async function checkStudentStatus() { return 'approved'; }
export async function registerStudent() { return 'approved'; }
export async function approveStudent() { return false; }
export async function rejectStudent() { return false; }