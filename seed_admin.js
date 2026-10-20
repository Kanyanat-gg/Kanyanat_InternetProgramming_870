require('dotenv').config();
const crypto = require('crypto');
const mysql = require('mysql2/promise');
const USERNAME = 'admin';        // เปลี่ยนได้ตามต้องการ
const PASSWORD = '1409'; // เปลี่ยนเป็นรหัสผ่านที่ต้องการ แล้วลบออกจากไฟล์นี้หลังใช้งาน
function hashPassword(password) {
 const salt = crypto.randomBytes(16).toString('hex');
 const hash = crypto.scryptSync(password, salt, 64).toString('hex');
 return `${salt}:${hash}`;
}
(async () => {
 const pool = mysql.createPool({
   host: process.env.DB_HOST,
   user: process.env.DB_USER,
   password: process.env.DB_PASSWORD,
   database: process.env.DB_NAME,
   port: process.env.DB_PORT || 3306,
 });
 try {
   const hashed = hashPassword(PASSWORD);
   await pool.query(
     'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
     [USERNAME, hashed, 'admin']
   );
   console.log(`สร้างบัญชี admin สำเร็จ: username="${USERNAME}"`);
 } catch (err) {
   console.error('สร้างบัญชีไม่สำเร็จ:', err.message);
 } finally {
   await pool.end();
 }
})();