declare module "crypto-js" {
  interface Hasher { toString: () => string }
  const CryptoJS: { MD5: (s: string) => Hasher };
  export default CryptoJS;
}
