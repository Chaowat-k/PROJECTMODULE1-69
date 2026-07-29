// ===== monitoring.tsx =====
// หน้า Monitoring - ตรวจสอบสถานะการเชื่อมต่อระบบ
// แสดงสถานะของ Sensor, API และ Database

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, ScrollView, Platform } from "react-native";
import { LightSensor } from "expo-sensors";
import { getMonitoring } from "../services/api";

export default function MonitoringDashboard() {
  // ===== State สำหรับเก็บข้อมูลต่าง ๆ =====

  // สถานะ Sensor (true = ทำงาน, false = ไม่ทำงาน)
  const [sensorOnline, setSensorOnline] = useState(false);

  // สถานะ API (true = เชื่อมต่อได้, false = เชื่อมต่อไม่ได้)
  const [apiConnected, setApiConnected] = useState(false);

  // สถานะ Database (true = เชื่อมต่อได้, false = เชื่อมต่อไม่ได้)
  const [dbConnected, setDbConnected] = useState(false);


  // ===== ฟังก์ชันตรวจสอบ Sensor =====
  const checkSensor = () => {
    // ตั้งค่าอัตราการอ่าน sensor (2 วินาที)
    LightSensor.setUpdateInterval(2000);

    // เริ่มฟังค่า sensor
    const sub = LightSensor.addListener((data) => {
      // ถ้าอ่านค่าได้ แสดงว่า sensor ทำงาน
      setSensorOnline(true);
    });

    // คืนค่า subscription สำหรับยกเลิกทีหลัง
    return sub;
  };

  // ===== ฟังก์ชันดึงข้อมูลจาก API =====
  const fetchMonitoring = async () => {
    try {
      // เรียก API ดึงข้อมูล monitoring
      const data = await getMonitoring();

      // ถ้าเรียก API สำเร็จ
      setApiConnected(true);

      // ถ้า API โหลดข้อมูลมาได้ แสดงว่า Database ก็เชื่อมต่อได้ปกติ
      if (data) {
        setDbConnected(true);
      } else {
        setDbConnected(false);
      }
    } catch (error) {
      // ถ้าเรียก API ไม่ได้
      setApiConnected(false);
      setDbConnected(false);
    }
  };

  // ===== useEffect - ทำงานเมื่อเปิดหน้า =====
  useEffect(() => {
    // ดึงข้อมูลจาก API
    fetchMonitoring();

    // ตรวจสอบ Sensor (ทำงานเฉพาะ Android)
    let sub: any = null;
    if (Platform.OS === "android") {
      sub = checkSensor();
    }

    // ยกเลิก sensor เมื่อออกจากหน้า
    return () => {
      if (sub) {
        sub.remove();
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* ===== หัวข้อหลัก ===== */}
      <Text style={styles.title}>Monitoring Dashboard</Text>

      <View>
        {/* Sensor Status */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Sensor Status</Text>
          <Text style={styles.boxValue}>
            {sensorOnline ? "🟢 Online" : "🔴 Offline"}
          </Text>
        </View>

        {/* API Status */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>API Status</Text>
          <Text style={styles.boxValue}>
            {apiConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </Text>
        </View>

        {/* Database Status */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Database Status</Text>
          <Text style={styles.boxValue}>
            {dbConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </Text>
        </View>
      </View>

      {/* ===== ปุ่ม Refresh ===== */}
      <View style={styles.buttonContainer}>
        <Button title="Refresh" onPress={fetchMonitoring} />
      </View>

      {/* ===== เว้นระยะด้านล่าง ===== */}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#000",
  },
  box: {
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  boxTitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  boxValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000",
  },
  buttonContainer: {
    marginTop: 10,
  },
});
