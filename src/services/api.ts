// ===== api.ts =====
// ไฟล์นี้เก็บฟังก์ชันทั้งหมดที่ใช้เรียก API
// ใช้ Axios ในการส่ง HTTP Request

import axios from "axios";
import { LightHistory, Statistics } from "../types/types";

const BASE_URL = "http://172.21.245.103/light_sensor/api";

// ===== ฟังก์ชันเพิ่มข้อมูล =====
// ส่งค่า lux และ status ไปบันทึกในฐานข้อมูล
export const addLight = async (lux: number, status: string) => {
  const res = await axios.post(`${BASE_URL}/addLight.php`, {
    lux: lux,
    status: status,
  });
  return res.data;
};

// ===== ฟังก์ชันดึงข้อมูลทั้งหมด =====
// ดึงข้อมูลประวัติทั้งหมดจากฐานข้อมูล
export const getHistory = async (): Promise<LightHistory[]> => {
  const res = await axios.get(`${BASE_URL}/getHistory.php`);
  return res.data.data;
};

// ===== ฟังก์ชันลบข้อมูล =====
// ลบข้อมูลตาม id ที่ระบุ
export const deleteLight = async (id: number) => {
  const res = await axios.delete(`${BASE_URL}/deleteLight.php?id=${id}`);
  return res.data;
};

// ===== ฟังก์ชันดึงข้อมูลสถิติ =====
// ดึงข้อมูลสรุป (จำนวน, ค่าเฉลี่ย, สูงสุด, ต่ำสุด)
export const getStatistics = async (): Promise<Statistics> => {
  const res = await axios.get(`${BASE_URL}/getStatistics.php`);
  return res.data.data;
};
