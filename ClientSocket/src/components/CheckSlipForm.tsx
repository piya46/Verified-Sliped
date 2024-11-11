import { useState, ChangeEvent, FormEvent } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import 'bootstrap/dist/css/bootstrap.min.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons'; // ไอคอน PDF

const CheckSlipForm = () => {
    const [amount, setAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [supportFile, setSupportFile] = useState<File | null>(null); // สำหรับไฟล์สนับสนุน
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [isAmountOver10000, setIsAmountOver10000] = useState(false); // ตรวจสอบยอดเกิน 10,000
    const [errors, setErrors] = useState<any>({}); // เก็บข้อผิดพลาด

    // ฟังก์ชันตรวจสอบจำนวนเงิน
    const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
        const amountValue = e.target.value;
        setAmount(amountValue);

        // ตรวจสอบยอดเกิน 10,000 บาทหรือไม่
        if (Number(amountValue) >= 10000) {
            setIsAmountOver10000(true);
        } else {
            setIsAmountOver10000(false);
        }

        // ตรวจสอบจำนวนเงิน
        if (amountValue && (isNaN(Number(amountValue)) || Number(amountValue) <= 0)) {
            setErrors((prevErrors: any) => ({
                ...prevErrors,
                amount: 'กรุณากรอกจำนวนเงินที่มากกว่า 0 และเป็นตัวเลข'
            }));
        } else {
            setErrors((prevErrors: any) => {
                const { amount, ...rest } = prevErrors; // ลบข้อผิดพลาดของจำนวนเงิน
                return rest;
            });
        }
    };

    // ฟังก์ชันตรวจสอบข้อมูลทั่วไป
    const handleInputChange = (field: string, value: string) => {
        if (!value) {
            setErrors((prevErrors: any) => ({
                ...prevErrors,
                [field]: `กรุณากรอก${field === 'name' ? 'ชื่อ' : 'นามสกุล'}`,
            }));
        } else {
            setErrors((prevErrors: any) => {
                const { [field]: removedError, ...rest } = prevErrors; 
                return rest;
            });
        }
    };

    const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setName(value); // อัปเดตค่าของ name
        handleInputChange('name', value); // ตรวจสอบความถูกต้อง
    };

    const handleSurnameChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSurname(value); // อัปเดตค่าของ surname
        handleInputChange('surname', value); // ตรวจสอบความถูกต้อง
    };

    // ฟังก์ชันตรวจสอบไฟล์
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    // ฟังก์ชันตรวจสอบเบอร์โทรศัพท์
const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);

    // ใช้ Regular Expression เพื่อตรวจสอบเบอร์โทรศัพท์
    const phonePattern = /^(06|08|09)[0-9]{8}$/;
    if (!phonePattern.test(value)) {
        setErrors((prevErrors: any) => ({
            ...prevErrors,
            phone: 'เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 06, 08, หรือ 09 และมีความยาว 10 หลัก'
        }));
    } else {
        setErrors((prevErrors: any) => {
            const { phone, ...rest } = prevErrors; // ลบข้อผิดพลาดของเบอร์โทร
            return rest;
        });
    }
};


    // ฟังก์ชันตรวจสอบไฟล์สนับสนุน
    const handleSupportFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fileType = file.type;

            // ตรวจสอบว่าเป็นไฟล์รูปภาพหรือ PDF
            if (!fileType.startsWith('image/') && fileType !== 'application/pdf') {
                setErrors((prevErrors: any) => ({
                    ...prevErrors,
                    supportFile: 'ไฟล์สนับสนุนต้องเป็นรูปภาพหรือ PDF เท่านั้น'
                }));
            } else {
                setErrors((prevErrors: any) => {
                    const { supportFile, ...rest } = prevErrors; // ลบข้อผิดพลาดของไฟล์สนับสนุน
                    return rest;
                });
                setSupportFile(file);
            }
        }
    };

    // ฟังก์ชันการส่งข้อมูล
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        // ตรวจสอบว่ามีการกรอกข้อมูลหรือไม่
        if (!name || !surname || !phone) {
            Swal.fire('ข้อผิดพลาด', 'กรุณากรอกชื่อ นามสกุล และเบอร์โทรศัพท์', 'error');
            return;
        }

        // ตรวจสอบว่า amount มีค่าหรือไม่ และต้องเป็นตัวเลขที่มากกว่า 0
        if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            setErrors((prevErrors: any) => ({
                ...prevErrors,
                amount: 'กรุณากรอกจำนวนเงินที่ถูกต้อง (ต้องเป็นตัวเลขที่มากกว่า 0)'
            }));
            return;
        }

        // ตรวจสอบว่าไฟล์หลักถูกเลือกหรือไม่
        if (!file) {
            setErrors((prevErrors: any) => ({
                ...prevErrors,
                file: 'กรุณาอัปโหลดไฟล์สลิป'
            }));
            return;
        }

        // ถ้ายอดเกิน 10,000 ตรวจสอบว่าไฟล์สนับสนุนถูกเลือกหรือไม่
        if (isAmountOver10000 && !supportFile) {
            setErrors((prevErrors: any) => ({
                ...prevErrors,
                supportFile: 'กรุณาอัปโหลดไฟล์สนับสนุน'
            }));
            return;
        }

        setLoading(true); // เริ่มโหลด

        const formData = new FormData();
        formData.append('amount', amount);
        formData.append('file', file);
        formData.append('name', name);
        formData.append('surname', surname);
        formData.append('phone', phone);

        if (supportFile) {
            formData.append('supportFile', supportFile);
        }

        try {
            const response = await axios.post('/check-slip', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            Swal.fire('สำเร็จ', response.data.message, 'success');
        } catch (error: any) {
            if (error.response && error.response.data && error.response.data.message) {
                Swal.fire('ข้อผิดพลาด', `เกิดข้อผิดพลาด: ${error.response.data.message}`, 'error');
            } else {
                Swal.fire('ข้อผิดพลาด', 'เกิดข้อผิดพลาดในการตรวจสอบสลิป', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadTemplate = () => {
        window.location.href = 'https://drive.google.com/uc?export=download&id=1KI8YFrTcX4peG3jhU7gueH-aqrGI3Jx4'; // ลิงก์ไฟล์ต้นแบบ
    };

    return (
        <div className="container mt-4">
            <div className="text-center mb-4">
                <img
                    src="pic/ท่านสามารถโอนเงินสนับสนุนจัดงานได้ที่ นางสาวจารุรัตน์ ชัยยศบูรณะ และ นางชลิดา ประดั.png"
                    alt="Banner"
                    className="img-fluid"
                    style={{ maxWidth: '50%', height: 'auto' }}
                />
            </div>

            <form onSubmit={handleSubmit} className="bg-light p-4 rounded shadow">
                <h3 className="text-center mb-4">สนับสนุนงานคืนเหย้า ประจำปี 2568</h3>

                <div className="mb-3">
                    <label htmlFor="name" className="form-label">ชื่อ</label>
                    <input
                        type="text"
                        id="name"
                        className="form-control"
                        placeholder="ชื่อ"
                        value={name}
                        onChange={handleNameChange}
                        required
                    />
                    {errors.name && <small className="text-danger">{errors.name}</small>}
                </div>

                <div className="mb-3">
                    <label htmlFor="surname" className="form-label">นามสกุล</label>
                    <input
                        type="text"
                        id="surname"
                        className="form-control"
                        placeholder="นามสกุล"
                        value={surname}
                        onChange={handleSurnameChange}
                        required
                    />
                    {errors.surname && <small className="text-danger">{errors.surname}</small>}
                </div>

                <div className="mb-3">
                    <label htmlFor="phone" className="form-label">เบอร์โทรศัพท์</label>
                    <input
                        type="text"
                        id="phone"
                        className="form-control"
                        placeholder="เบอร์โทรศัพท์"
                        value={phone}
                        onChange={handlePhoneChange}
                        required
                    />
                    {errors.phone && <small className="text-danger">{errors.phone}</small>}
                </div>

                <div className="mb-3">
                    <label htmlFor="amount" className="form-label">ยอดเงิน</label>
                    <input
                        type="text"
                        id="amount"
                        className="form-control"
                        placeholder="ยอดเงิน"
                        value={amount}
                        onChange={handleAmountChange}
                        required
                    />
                    {errors.amount && <small className="text-danger">{errors.amount}</small>}
                </div>

                <div className="mb-3">
                    <label htmlFor="file" className="form-label">ไฟล์สลิป</label>
                    <input
                        type="file"
                        id="file"
                        className="form-control"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />
                    {errors.file && <small className="text-danger">{errors.file}</small>}
                </div>

                {isAmountOver10000 && (
                    <div className="mb-3">
                        <label htmlFor="supportFile" className="form-label">อัพโหลดไฟล์สนับสนุน </label>
                        <input
                            type="file"
                            id="supportFile"
                            className="form-control"
                            onChange={handleSupportFileChange}
                            required
                        />
                        <button
                            type="button"
                            className="btn btn-outline-secondary mt-2"
                            onClick={handleDownloadTemplate}
                        >
                            <FontAwesomeIcon icon={faFilePdf} className="me-2" />
                            ดาวน์โหลดไฟล์ขอสนับสนุนงาน
                        </button>
                        {errors.supportFile && <small className="text-danger">{errors.supportFile}</small>}
                    </div>
                )}

                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'กำลังตรวจสอบสลิป...' : 'ตรวจสอบสลิป'}
                </button>
            </form>

            <footer className="text-center mt-4 py-4 bg-dark text-white" style={{ transition: 'background-color 0.3s ease' }}>
                <p>&copy; 2024 All Rights Reserved.</p>
            </footer>
        </div>
    );
};

export default CheckSlipForm;
