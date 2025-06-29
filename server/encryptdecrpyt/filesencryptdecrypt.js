const crypto = require('crypto');
const fs = require('fs');

//encrpyt the file
const encryptFile = (filePath) => {
  const algorithm = "aes-256-cbc";
  const key = crypto.randomBytes(32); // 32-byte key
  const iv = crypto.randomBytes(16); // 16-byte IV

  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(`${filePath}.enc`);

  input.pipe(cipher).pipe(output);
  return { key, iv, encryptedFile: `${filePath}.enc` };
};

// Decrypt a file
const decryptFile = (encryptedFilePath, outputFilePath, key, iv) => {
  const algorithm = "aes-256-cbc";
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(key, "hex"),
    Buffer.from(iv, "hex")
  );

  const input = fs.createReadStream(encryptedFilePath);
  const output = fs.createWriteStream(outputFilePath);

  input.pipe(decipher).pipe(output);
};

// Upload file endpoint
const uploadFile = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    const { key, iv, encryptedFile } = encryptFile(req.file.path);
    res.status(200).send({
      message: "File uploaded and encrypted successfully.",
      encryptedFile,
      key: key.toString("hex"),
      iv: iv.toString("hex"),
    });
  } catch (error) {
    res.status(500).send({ message: "File upload failed.", error });
  }
};

// Download file endpoint
const downloadFile = (req, res) => {
  const { filename } = req.params;
  const { key, iv } = req.query;
  const encryptedFilePath = `uploads/${filename}`;
  const decryptedFilePath = `uploads/decrypted-${filename}`;

  try {
    decryptFile(encryptedFilePath, decryptedFilePath, key, iv);
    res.download(decryptedFilePath, () => {
      fs.unlinkSync(decryptedFilePath); // Delete decrypted file after sending
    });
  } catch (error) {
    res.status(500).send({ message: "File download failed.", error });
  }
};

module.exports = { uploadFile, downloadFile };
