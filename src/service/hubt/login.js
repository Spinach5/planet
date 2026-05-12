// login.js
import { auth } from "./auth";
import xhidManager from "./XHid";

export async function login(stuID, password) {
	await auth(stuID, password);
	xhidManager.init();
	// const xhid = xhidManager.fetchXhid();
	// console.log(xhid)
}
