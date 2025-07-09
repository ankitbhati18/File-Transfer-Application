const crypto = require('crypto');
const fs = require('fs');
const CryptoJS = require('crypto-js');

// Generate a secure encryption key if not provided
const generateEncryptionKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || generateEncryptionKey();

const encryptFile = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }
    
    const fileBuffer = fs.readFileSync(filePath);
    const encrypted = CryptoJS.AES.encrypt(fileBuffer.toString('base64'), ENCRYPTION_KEY).toString();
    
    const encryptedPath = filePath + '.encrypted';
    fs.writeFileSync(encryptedPath, encrypted);
    
    return encryptedPath;
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

const decryptFile = async (encryptedFilePath) => {
  try {
    if (!fs.existsSync(encryptedFilePath)) {
      throw new Error('Encrypted file not found');
    }
    
    const encryptedData = fs.readFileSync(encryptedFilePath, 'utf8');
    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const decryptedBuffer = Buffer.from(decrypted.toString(CryptoJS.enc.Utf8), 'base64');
    
    const decryptedPath = encryptedFilePath.replace('.encrypted', '.decrypted');
    fs.writeFileSync(decryptedPath, decryptedBuffer);
    
    return decryptedPath;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

module.exports = { encryptFile, decryptFile };
