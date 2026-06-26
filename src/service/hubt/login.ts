import { auth } from './auth';
import { getXhid } from './GetXhid';
import { getStuInfo } from './StuInfo';
import userManager from '../../service/userInfo';
import { runtimeLogger } from '../../utils/runtimeLogger';

interface LoginResult {
  success: boolean;
  message: string;
}

/**
 * Full login flow: encrypt password → submit to HBUT → get xhid → get student info
 * Matches the original Taro auth flow.
 */
export async function login(stuID: string, password: string): Promise<LoginResult> {
  // Step 1: Authenticate with the HBUT academic system
  const authResult = await auth(stuID, password);

  if (!authResult.success) {
    return { success: false, message: authResult.message };
  }

  try {
    // Step 2: Get xhid (student identifier in the academic system)
    runtimeLogger.info('Login', '正在获取学籍标识...');
    const xhid = await getXhid();
    runtimeLogger.info('Login', `获取学籍标识成功: ${xhid}`);

    // Step 3: Get student information
    runtimeLogger.info('Login', '正在获取学生信息...');
    const stuInfo = await getStuInfo() as Record<string, unknown>;
    runtimeLogger.info('Login', '获取学生信息成功');

    // Step 4: Save to userManager
    userManager.stuId = stuID;
    userManager.password = password;
    userManager.isLoggedIn = true;

    if (typeof stuInfo.realName === 'string') userManager.realName = stuInfo.realName;
    if (typeof stuInfo.xh === 'string') userManager.stuId = stuInfo.xh;
    if (typeof stuInfo.college === 'string') userManager.college = stuInfo.college;
    if (typeof stuInfo.majority === 'string') userManager.majority = stuInfo.majority;
    if (typeof stuInfo.className === 'string') userManager.class = stuInfo.className;
    if (typeof stuInfo.grade === 'string') userManager.grade = stuInfo.grade;

    userManager.setField('xhid', xhid);
    await userManager.saveToCache();

    runtimeLogger.info('Login', '登录流程完成，用户信息已保存');
    return { success: true, message: '登录成功' };
  } catch (error) {
    runtimeLogger.error('Login', '登录后续流程失败', error);
    // Even if xhid/stuInfo fails, the login cookie is already set
    // Mark as logged in with basic info
    userManager.stuId = stuID;
    userManager.password = password;
    userManager.isLoggedIn = true;
    await userManager.saveToCache();

    return { success: true, message: '登录成功（部分信息获取失败）' };
  }
}
