// ===== types.ts =====
// ไฟล์นี้เก็บ Type ทั้งหมดที่ใช้ในโปรเจกต์

// Type สำหรับข้อมูล Light History (ข้อมูลที่ได้จากฐานข้อมูล)
export type LightHistory = {
  id: number;
  lux: number;
  status: string;
  created_at: string;
};


