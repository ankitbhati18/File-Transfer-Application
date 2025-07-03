const crypto = require('crypto');
const fs = require('fs');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-encryption-key';

const encryptFile = async (filePath) => {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const encrypted = CryptoJS.AES.encrypt(fileBuffer.toString('base64'), ENCRYPTION_KEY).toString();
    
    const encryptedPath = filePath + '.encrypted';
    fs.writeFileSync(encryptedPath, encrypted);
    
    return encryptedPath;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

module.exports = { encryptFile };
