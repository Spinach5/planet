// login.js
import { auth } from "./auth";

export async function login(stuID, password) {
	await auth(stuID, password);
}
