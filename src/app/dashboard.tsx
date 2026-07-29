// ===== index.tsx (Dashboard) =====
// หน้า Dashboard - อ่านค่า Light Sensor แบบ Real-time
// แสดงค่า Lux, สถานะ, และปุ่มบันทึกข้อมูล

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert, Platform, } from "react-native";
import { LightSensor } from "expo-sensors";
import { addLight } from "../services/api";
import { getStatus } from "../utils/helpers";

export default function Dashboard() {
  // ===== State สำหรับเก็บค่า Lux =====
  const [lux, setLux] = useState(0);

  // ===== State สำหรับเก็บ subscription ของ sensor =====
  const [subscription, setSubscription] = useState<any>(null);

  // ===== State สำหรับสถานะการบันทึก =====
  const [saving, setSaving] = useState(false);

  // ===== ฟังก์ชันเริ่มอ่านค่า Sensor =====
  const subscribe = () => {
    // ตั้งค่าอัตราการอัพเดต (1000ms = 1 วินาที)
    LightSensor.setUpdateInterval(1000);

    // เริ่มฟังค่า Sensor
    const sub = LightSensor.addListener((data) => {
      // อัพเดตค่า Lux ที่อ่านได้
      setLux(data.illuminance);
    });

    setSubscription(sub);
  };

  // ===== ฟังก์ชันหยุดอ่านค่า Sensor =====
  const unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  useEffect(() => {
    subscribe();

    // หยุดอ่านค่าเมื่อออกจากหน้า
    return () => unsubscribe();
  }, []);

  // ===== ฟังก์ชันบันทึกข้อมูลลงฐานข้อมูล =====
  const handleSave = async () => {
    try {
      setSaving(true);

      // กำหนดสถานะจากค่า Lux
      const status = getStatus(lux);

      // ส่งข้อมูลไป API
      const result = await addLight(lux, status);

      // แสดงผลลัพธ์
      if (result.success) {
        Alert.alert("สำเร็จ", "บันทึกข้อมูลสำเร็จ");
      } else {
        Alert.alert("ผิดพลาด", result.message);
      }
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถเชื่อมต่อ API ได้");
    } finally {
      setSaving(false);
    }
  };

  // ===== กำหนดสถานะปัจจุบัน =====
  const currentStatus = getStatus(lux);

  return (
    <View style={styles.container}>
      {/* ส่วนแสดงหัวข้อ */}
      <Text style={styles.title}>Light Sensor</Text>

      {/* ส่วนแสดงค่า Lux */}
      <View style={styles.card}>
        <Text style={styles.label}>ค่า Lux:</Text>
        <Text style={styles.value}>
          {Platform.OS === "android"
            ? lux.toFixed(2)
            : "ใช้ได้เฉพาะ Android"}
        </Text>
      </View>

      {/* ส่วนแสดงสถานะ */}
      <View style={styles.card}>
        <Text style={styles.label}>สถานะ:</Text>
        <Text style={styles.value}>
          {Platform.OS === "android" ? currentStatus : "-"}
        </Text>
      </View>

      {/* ส่วนปุ่มบันทึก */}
      <View style={styles.buttonContainer}>
        <Button
          title={saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
          onPress={handleSave}
          disabled={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: "#666",
    marginBottom: 5,
  },
  value: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  buttonContainer: {
    marginTop: 20,
  },
});