// ===== history.tsx =====
// หน้า History - แสดงประวัติข้อมูล Light Sensor ทั้งหมด
// ดึงข้อมูลจากฐานข้อมูล มีปุ่ม Refresh และ Delete

import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Button, Alert, } from "react-native";
import { getHistory, deleteLight } from "../services/api";
import { LightHistory } from "../types/types";

export default function History() {
  // ===== State สำหรับเก็บรายการข้อมูล =====
  const [list, setList] = useState<LightHistory[]>([]);

  // ===== State สำหรับสถานะกำลังโหลด =====
  const [loading, setLoading] = useState(false);

  // ===== ฟังก์ชันดึงข้อมูลจาก API =====
  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getHistory();
      setList(data);
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== ฟังก์ชันลบข้อมูล =====
  const handleDelete = (id: number) => {
    // แสดง popup ยืนยันก่อนลบ
    Alert.alert("ยืนยัน", "ต้องการลบข้อมูลนี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            // เรียก API ลบข้อมูล
            const result = await deleteLight(id);
            if (result.success) {
              // ดึงข้อมูลใหม่หลังลบสำเร็จ
              fetchData();
            } else {
              Alert.alert("ผิดพลาด", result.message);
            }
          } catch (error) {
            Alert.alert("ผิดพลาด", "ไม่สามารถลบข้อมูลได้");
          }
        },
      },
    ]);
  };

  // ===== ฟังก์ชันแสดงข้อมูลแต่ละรายการ =====
  const renderItem = ({ item }: { item: LightHistory }) => (
    <View style={styles.item}>
      {/* แสดงเวลา */}
      <Text style={styles.time}>{item.created_at}</Text>

      {/* แสดงค่า Lux */}
      <Text style={styles.lux}>Lux: {item.lux}</Text>

      {/* แสดงสถานะ */}
      <Text style={styles.status}>สถานะ: {item.status}</Text>

      {/* ปุ่มลบ */}
      <View style={styles.deleteButton}>
        <Button title="ลบ" color="red" onPress={() => handleDelete(item.id)} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ส่วนปุ่ม Refresh */}
      <View style={styles.refreshButton}>
        <Button title="Refresh" onPress={fetchData} />
      </View>

      {/* ส่วนแสดงจำนวนข้อมูล */}
      <Text style={styles.count}>ทั้งหมด: {list.length} รายการ</Text>

      {/* ส่วนแสดงรายการข้อมูล */}
      {loading ? (
        <Text style={styles.loading}>กำลังโหลด...</Text>
      ) : list.length === 0 ? (
        <Text style={styles.empty}>ไม่มีข้อมูล</Text>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  refreshButton: {
    marginBottom: 10,
  },
  count: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  loading: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
  empty: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#999",
  },
  item: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  time: {
    fontSize: 14,
    color: "#999",
    marginBottom: 5,
  },
  lux: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  status: {
    fontSize: 16,
    color: "#666",
    marginBottom: 10,
  },
  deleteButton: {
    alignSelf: "flex-end",
  },
});