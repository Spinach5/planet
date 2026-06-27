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
    const stuInfo = await getStuInfo();
    runtimeLogger.info('Login', '获取学生信息成功');

    // Step 4: Save to userManager — use mapped fields from CleanStuInfo
    userManager.stuId = stuID;
    userManager.password = password;
    userManager.isLoggedIn = true;
    userManager.xhid = xhid;

    userManager.realName = stuInfo.realName;
    userManager.college = stuInfo.college;
    userManager.majority = stuInfo.majority;
    userManager.class = stuInfo.class;
    userManager.grade = stuInfo.grade;
    userManager.university = '湖北工业大学';

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
