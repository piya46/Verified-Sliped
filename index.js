const express = require('express');
const axios = require('axios');
const { google } = require('googleapis');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const sendgrid = require('@sendgrid/mail');
const FormData = require('form-data'); // เพิ่มการใช้ FormData

dotenv.config();
const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(bodyParser.json());

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

// Google Sheets API Authentication
const auth = new google.auth.GoogleAuth({
    keyFile: 'credentials/service-account.json',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});
const sheets = google.sheets('v4');

// ฟังก์ชันส่งอีเมลด้วย SendGrid
// ฟังก์ชันส่งอีเมลด้วย SendGrid
async function sendEmail(details, files) {
    const msg = {
        to: 'piyawork52@gmail.com', // อีเมลที่กำหนดไว้
        from: process.env.EMAIL,
        subject: `เรียนผู้จัดงานคืนเหย้ามีผู้สนับสนุนงานคืนเหย้าผ่านระบบลงทะเบียนงานคืนเหย้า ประจำปี 2568 ของคุณ ${details.name} ${details.surname}`,
        text: `มีการสนับสนุนจากคุณ ${details.name} ${details.surname} เป็นจำนวนเงิน ${details.amount} บาท ได้มีการตรวจสอบสลิปเรียบร้อยผ่านระบบ SlipOk 
        \nเบอร์โทรศัพท์ติดต่อผู้สนับสนุน: ${details.phone}`,
    };

    // ตรวจสอบยอดเงิน หากเกิน 10,000 บาท ให้ส่งไฟล์ทั้งหมด
    if (details.amount >= 10000 && files && files.length > 0) {
        // ส่งไฟล์ทั้งหมด
        msg.attachments = files.map(file => {
            const fileContent = fs.readFileSync(file.path).toString("base64");
            return {
                content: fileContent,
                filename: file.originalname, // ชื่อไฟล์ที่ผู้ใช้ส่งมา
                type: 'application/octet-stream', // คุณสามารถปรับตามชนิดไฟล์
                disposition: 'attachment'
            };
        });
    } else if (files && files.length > 0) {
        // หากยอดไม่ถึง 10,000 บาท ส่งไฟล์แรก
        const file = files[0];
        const fileContent = fs.readFileSync(file.path).toString("base64");
        msg.attachments = [{
            content: fileContent,
            filename: file.originalname, // ชื่อไฟล์ที่ผู้ใช้ส่งมา
            type: 'application/octet-stream', // คุณสามารถปรับตามชนิดไฟล์
            disposition: 'attachment'
        }];
    }

    await sendgrid.send(msg);
}



// เส้นทาง API สำหรับตรวจสอบสลิป
// app.post('/check-slip', upload.single('file'), async (req, res) => {
//     try {
//         const { data, amount } = req.body;
//         const file = req.file;

//         // ใช้ FormData เพื่อสร้างคำขอที่ถูกต้อง
//         const formData = new FormData();
//         formData.append('files', fs.createReadStream(file.path)); // ส่งไฟล์เป็น stream
//         formData.append('amount', amount);
//         formData.append('data', data || '');  // ส่ง data ถ้ามี
//         // formData.append('log', 'true');  // เพิ่ม log เป็น true

//         const config = {
//             headers: {
//                 ...formData.getHeaders(), // ตั้งค่า header สำหรับ multipart/form-data
//                 'x-authorization': process.env.SLIPOK_API_KEY,
//             },
//         };

//         const response = await axios.post(process.env.SLIPOK_API_URL, formData, config);

//         if (response.data.success && response.data.amount > 10000) {
//             await sendEmail(response.data, file ? [file, supportFile] : [file]); // ส่งไฟล์ทั้งหมดถ้ายอดมากกว่า 10,000 บาท
//         } else {
//             await sendEmail(response.data, file ? [file] : []); // ส่งเฉพาะไฟล์แรกหากยอดไม่ถึง 10,000 บาท
//         }
        

//         // เขียนข้อมูลลง Google Sheets
//         // const authClient = await auth.getClient();
//         // await sheets.spreadsheets.values.append({
//         //     auth: authClient,
//         //     spreadsheetId: process.env.SPREADSHEET_ID,
//         //     range: 'Sheet1!A1',
//         //     valueInputOption: 'USER_ENTERED',
//         //     resource: { values: [[response.data.transRef, response.data.amount, new Date().toISOString()]] },
//         // });

//         res.status(200).json({ message: 'สลิปได้รับการตรวจสอบเรียบร้อย' });
//     } catch (error) {
//         console.error(error);
//         // ตรวจสอบว่ามี response จาก SlipOK หรือไม่
//         if (error.response) {
//             // หากมี response จาก SlipOK ให้แสดงข้อความจาก API ของ SlipOK
//             const slipErrorMessage = error.response.data.message || 'ไม่ทราบสาเหตุของข้อผิดพลาด';
//             return res.status(error.response.status).json({ 
//                 error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป', 
//                 message: slipErrorMessage // แสดงข้อความจาก SlipOK
//             });
//         }

//         //กรณีเกิดข้อผิดพลาดทั่วไป
//         res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป' });
//     }
// });
// เส้นทาง API สำหรับตรวจสอบสลิป


// app.post('/check-slip', upload.single('file'), async (req, res) => {
//     try {
//         const { data, amount, name, surname } = req.body;  // ดึง name และ surname จาก req.body
//         const file = req.file;

//         // ตรวจสอบว่า name และ surname มีค่าหรือไม่
//         if (!name || !surname) {
//             return res.status(400).json({ error: 'ชื่อและนามสกุลหายไป' });
//         }

//         // ใช้ FormData เพื่อสร้างคำขอที่ถูกต้อง
//         const formData = new FormData();
//         formData.append('files', fs.createReadStream(file.path)); // ส่งไฟล์เป็น stream
//         formData.append('amount', amount);
//         formData.append('data', data || '');  // ส่ง data ถ้ามี
//         // formData.append('log', 'true');  // เพิ่ม log เป็น true

//         const config = {
//             headers: {
//                 ...formData.getHeaders(), // ตั้งค่า header สำหรับ multipart/form-data
//                 'x-authorization': process.env.SLIPOK_API_KEY,
//             },
//         };

//         const response = await axios.post(process.env.SLIPOK_API_URL, formData, config);

//         // ส่งอีเมลโดยส่ง name และ surname จาก req.body
//         if (response.data.success && response.data.amount > 10000) {
//             await sendEmail({ ...response.data, name, surname, amount }, file ? [file, supportFile] : [file]); // ส่งไฟล์ทั้งหมดถ้ายอดมากกว่า 10,000 บาท
//         } else {
//             await sendEmail({ ...response.data, name, surname, amount}, file ? [file] : []); // ส่งเฉพาะไฟล์แรกหากยอดไม่ถึง 10,000 บาท
//         }

//         res.status(200).json({ message: 'สลิปได้รับการตรวจสอบเรียบร้อย' });
//     } catch (error) {
//         console.error(error);
//         // ตรวจสอบว่ามี response จาก SlipOK หรือไม่
//         if (error.response) {
//             const slipErrorMessage = error.response.data.message || 'ไม่ทราบสาเหตุของข้อผิดพลาด';
//             return res.status(error.response.status).json({ 
//                 error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป', 
//                 message: slipErrorMessage
//             });
//         }

//         res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป' });
//     }
// });


// ฟังก์ชันสำหรับการตรวจสอบสลิป
// app.post('/check-slip', upload.fields([
//     { name: 'file', maxCount: 1 },  // สำหรับสลิป
//     { name: 'supportFile', maxCount: 1 }  // ถ้ามีไฟล์สนับสนุน
// ]), async (req, res) => {
//     try {
//         const { name, surname, amount, data } = req.body;  // รับข้อมูลจาก body
//         const file = req.files['file'] ? req.files['file'][0] : null; // ตรวจสอบไฟล์หลัก
//         const supportFile = req.files['supportFile'] ? req.files['supportFile'][0] : null; // ถ้ามีไฟล์สนับสนุน

//         if (!file) {
//             return res.status(400).json({ error: 'กรุณาอัพโหลดไฟล์สลิป' });
//         }

//         // ใช้ FormData เพื่อสร้างคำขอที่ถูกต้อง
//         const formData = new FormData();
//         formData.append('files', fs.createReadStream(file.path)); // ส่งไฟล์เป็น stream
//         formData.append('amount', amount);
//         formData.append('data', data || '');

//         const config = {
//             headers: {
//                 ...formData.getHeaders(),
//                 'x-authorization': process.env.SLIPOK_API_KEY,
//             },
//         };

//         const response = await axios.post(process.env.SLIPOK_API_URL, formData, config);

//         // ตรวจสอบว่ามีไฟล์สนับสนุนหรือไม่ และส่งไฟล์ทั้งหมดหากยอดเงินเกิน 10,000
//         const filesToSend = [];
//         if (file) filesToSend.push(file);
//         if (supportFile) filesToSend.push(supportFile);

//         // ดำเนินการตามยอดเงินและส่งอีเมล
//         if (response.data.success && response.data.amount > 10000) {
//             await sendEmail({ name, surname, amount }, filesToSend); // ส่งไฟล์ทั้งหมดหากยอดมากกว่า 10,000 บาท
//         } else {
//             await sendEmail({ name, surname, amount }, [file]); // ส่งเฉพาะไฟล์หลักหากยอดไม่ถึง 10,000 บาท
//         }

//         res.status(200).json({ message: 'สลิปได้รับการตรวจสอบเรียบร้อย' });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป' });
//     }
// });

app.post('/check-slip', upload.fields([
    { name: 'file', maxCount: 1 },  // สำหรับสลิป
    { name: 'supportFile', maxCount: 1 }  // ถ้ามีไฟล์สนับสนุน
]), async (req, res) => {
    try {
        const { name, surname, amount, data, phone } = req.body;  // รับข้อมูลจาก body
        const file = req.files['file'] ? req.files['file'][0] : null; // ตรวจสอบไฟล์หลัก
        const supportFile = req.files['supportFile'] ? req.files['supportFile'][0] : null; // ถ้ามีไฟล์สนับสนุน

        if (!file) {
            return res.status(400).json({ error: 'กรุณาอัพโหลดไฟล์สลิป' });
        }

        // ใช้ FormData เพื่อสร้างคำขอที่ถูกต้อง
        const formData = new FormData();
        formData.append('files', fs.createReadStream(file.path)); // ส่งไฟล์เป็น stream
        formData.append('amount', amount);
        formData.append('data', data || ''); // ส่งข้อมูลที่มีหรือตั้งเป็นค่าว่าง
        formData.append('log', 'true');

        const config = {
            headers: {
                ...formData.getHeaders(),
                'x-authorization': process.env.SLIPOK_API_KEY,  // API key ของ SlipOK
            },
        };

        // เรียกใช้งาน API ของ SlipOK
        const response = await axios.post(process.env.SLIPOK_API_URL, formData, config);


        // สร้างรายการไฟล์ที่จะส่ง (ไฟล์หลักและไฟล์สนับสนุน)
        const filesToSend = [];
        if (file) filesToSend.push(file);
        if (supportFile) filesToSend.push(supportFile);

        // ตรวจสอบยอดเงินและส่งอีเมล
        if (response.data.success && amount >= 10000) {
            // ถ้ายอดเงินมากกว่า 10,000 บาท ส่งทั้งไฟล์หลักและไฟล์สนับสนุน
            await sendEmail({ name, surname, amount, phone }, filesToSend);
        } else {
            // ถ้ายอดเงินไม่ถึง 10,000 บาท ส่งแค่ไฟล์หลัก
            await sendEmail({ name, surname, amount, phone}, [file]);
        }

        res.status(200).json({ message: 'สลิปได้รับการตรวจสอบเรียบร้อย' });
    } catch (error) {
        console.error(error);
        // ตรวจสอบว่าเป็นข้อผิดพลาดจาก SlipOK หรือไม่
        if (error.response) {
            const slipErrorMessage = error.response.data.message || 'ไม่ทราบสาเหตุของข้อผิดพลาด';
            return res.status(error.response.status).json({ 
                error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป', 
                message: slipErrorMessage
            });
        }
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบสลิป' });
    }
});

// เริ่มต้นเซิร์ฟเวอร์
app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
});
