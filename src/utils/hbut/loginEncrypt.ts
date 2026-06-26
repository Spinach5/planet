import { JSEncrypt } from 'jsencrypt';

const PUBLIC_KEY =
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDcwU0RBrR31L3eHKVGogsJKdr36D3rrjUNaZ77yxxO9HSIojA4jyJylCVALkcu4cK+bbGLpedilJSlcyohso+IBI+A/eAfjS/GhIT/OWEsg8/+YLt+asM8+pdISE/T14tTqg/WDe8nqX48dazB0Izu1ytaPPFRWuYqtUTRpZ7IsQIDAQAB';

export default function encryptPassword(password: string): string {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(PUBLIC_KEY);
  const result = encrypt.encrypt(password);

  if (result === false) {
    throw new Error('加密失败，请检查公钥或输入内容');
  }
  return result;
}
