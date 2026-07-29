// ===== helpers.ts =====
// ไฟล์นี้เก็บฟังก์ชันช่วยเหลือทั่วไป

// ===== ฟังก์ชันกำหนดสถานะจากค่า Lux =====
// รับค่า lux แล้วคืนค่าสถานะเป็นข้อความ
export const getStatus = (lux: number): string => {
  if (lux < 20) {
    return "มืด";
  } else if (lux < 100) {
    return "สลัว";
  } else if (lux < 500) {
    return "สว่างปกติ";
  } else {
    return "สว่างมาก";
  }
};
