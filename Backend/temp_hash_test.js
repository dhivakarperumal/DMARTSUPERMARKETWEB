const crypto = require('crypto');
const pass = 'admin@123';
const stored = 'a15db6b156c4d52773f3d2343182d7a6:37d0e79d8240f797cccea81904ae4740e050b2061270c449be80af554dc1d8264ad17694967ba98cf3eb02314b34df4972c526a6fea837384ee3d9a06000a50a';
const [saltHex, target] = stored.split(':');
const saltBuf = Buffer.from(saltHex, 'hex');
const hex = (buf) => Buffer.isBuffer(buf) ? buf.toString('hex') : String(buf);
const sha = (algo, data) => crypto.createHash(algo).update(data).digest();
const hmac = (algo, key, data) => crypto.createHmac(algo, key).update(data).digest();
const pbkdf2 = (algo, iter) => crypto.pbkdf2Sync(pass, saltBuf, iter, 64, algo);
const inputs = [
  ['pass', Buffer.from(pass)],
  ['saltHex', Buffer.from(saltHex)],
  ['saltBuf', saltBuf],
  ['pass+saltHex', Buffer.concat([Buffer.from(pass), Buffer.from(saltHex)])],
  ['saltHex+pass', Buffer.concat([Buffer.from(saltHex), Buffer.from(pass)])],
  ['pass+saltBuf', Buffer.concat([Buffer.from(pass), saltBuf])],
  ['saltBuf+pass', Buffer.concat([saltBuf, Buffer.from(pass)])],
  ['pass:saltHex', Buffer.from(pass + ':' + saltHex)],
  ['saltHex:pass', Buffer.from(saltHex + ':' + pass)],
  ['pass+saltHex+pass', Buffer.concat([Buffer.from(pass), Buffer.from(saltHex), Buffer.from(pass)])],
  ['saltHex+pass+saltHex', Buffer.concat([Buffer.from(saltHex), Buffer.from(pass), Buffer.from(saltHex)])],
  ['pass+saltBuf+pass', Buffer.concat([Buffer.from(pass), saltBuf, Buffer.from(pass)])],
  ['saltBuf+pass+saltBuf', Buffer.concat([saltBuf, Buffer.from(pass), saltBuf])],
];
const algos = ['sha1','sha256','sha384','sha512','sha3-256','sha3-512','blake2b512','blake2s256'];
for (const algo of algos) {
  for (const [name, input] of inputs) {
    try {
      const digest = hex(sha(algo, input));
      if (digest === target) {
        console.log('MATCH', algo, name);
      }
    } catch (err) {}
  }
}
for (const keyType of ['saltHex','saltBuf']) {
  const key = keyType === 'saltHex' ? Buffer.from(saltHex) : saltBuf;
  for (const algo of ['sha1','sha256','sha384','sha512','sha3-256','sha3-512','blake2b512','blake2s256']) {
    try {
      const digest = hex(hmac(algo, key, pass));
      if (digest === target) {
        console.log('MATCH HMAC', algo, keyType);
      }
    } catch (err) {}
  }
}
for (const iter of [1,10,50,100,200,500,1000,2000,5000,10000]) {
  for (const algo of ['sha256','sha512']) {
    const digest = hex(pbkdf2(algo, iter));
    if (digest === target) {
      console.log('MATCH PBKDF2', algo, iter);
    }
  }
}
console.log('done');
