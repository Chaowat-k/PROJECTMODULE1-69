// ===== statistics.tsx =====
// หน้า Statistics - แสดงข้อมูลสถิติ
// คำนวณจากฐานข้อมูล: จำนวนทั้งหมด, ค่าเฉลี่ย, ค่าสูงสุด, ค่าต่ำสุด

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Alert } from "react-native";
import { getStatistics } from "../services/api";
import { Statistics as StatsType } from "../types/types";

export default function Statistics() {
  // ===== State สำหรับเก็บข้อมูลสถิติ =====
  const [stats, setStats] = useState<StatsType>({
    total: 0,
    avg_lux: 0,
    max_lux: 0,
    min_lux: 0,
  });

  // ===== State สำหรับสถานะกำลังโหลด =====
  const [loading, setLoading] = useState(false);

  // ===== ฟังก์ชันดึงข้อมูลสถิติจาก API =====
  const fetchStats = async () => {
    try {
      setLoading(true);
      // เรียก API ดึงข้อมูลสถิติ
      const data = await getStatistics();
      setStats(data);
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลสถิติได้");
    } finally {
      setLoading(false);
    }
  };

  // ===== ดึงข้อมูลเมื่อเปิดหน้า =====
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <View style={styles.container}>
      {/* ส่วนหัวข้อ */}
      <Text style={styles.title}>สถิติข้อมูล</Text>

      {/* แสดงสถานะกำลังโหลด */}
      {loading ? (
        <Text style={styles.loading}>กำลังโหลด...</Text>
      ) : (
        <View>
          {/* ส่วนแสดงจำนวนข้อมูลทั้งหมด */}
          <View style={styles.card}>
            <Text style={styles.label}>จำนวนข้อมูลทั้งหมด</Text>
            <Text style={styles.value}>{stats.total} รายการ</Text>
          </View>

          {/* ส่วนแสดงค่าเฉลี่ย Lux */}
          <View style={styles.card}>
            <Text style={styles.label}>ค่าเฉลี่ย Lux</Text>
            <Text style={styles.value}>{stats.avg_lux} lx</Text>
          </View>

          {/* ส่วนแสดงค่าสูงสุด */}
          <View style={styles.card}>
            <Text style={styles.label}>ค่าสูงสุด</Text>
            <Text style={styles.value}>{stats.max_lux} lx</Text>
          </View>

          {/* ส่วนแสดงค่าต่ำสุด */}
          <View style={styles.card}>
            <Text style={styles.label}>ค่าต่ำสุด</Text>
            <Text style={styles.value}>{stats.min_lux} lx</Text>
          </View>
        </View>
      )}

      {/* ส่วนปุ่ม Refresh */}
      <View style={styles.buttonContainer}>
        <Button title="Refresh" onPress={fetchStats} />
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
  loading: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
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
    marginTop: 10,
  },
});
