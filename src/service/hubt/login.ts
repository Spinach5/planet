import { auth } from './auth';

export async function login(stuID: string, password: string): Promise<void> {
  await auth(stuID, password);
}
