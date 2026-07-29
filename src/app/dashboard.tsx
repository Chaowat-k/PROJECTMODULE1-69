import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, Button, Alert, Platform } from "react-native";
import { LightSensor } from "expo-sensors";
import { addLight, getHistory, deleteLight } from "../services/api";
import { getStatus } from "../utils/helpers";
import { LightHistory } from "../types/types";

export default function Dashboard() {
  const [lux, setLux] = useState(0); // ค่า Lux จาก sensor
  const [subscription, setSubscription] = useState<any>(null); // subscription ของ sensor
  const [saving, setSaving] = useState(false); // สถานะกำลังบันทึก
  const [list, setList] = useState<LightHistory[]>([]); // รายการประวัติ

  // ===== ฟังก์ชันเริ่มอ่านค่า Sensor =====
  const subscribe = () => {
    LightSensor.setUpdateInterval(1000);
    const sub = LightSensor.addListener((data) => {
      setLux(data.illuminance);
    });
    setSubscription(sub);
  };

  // ===== ฟังก์ชันหยุดอ่านค่า Sensor =====
  const unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  // ===== ฟังก์ชันดึงข้อมูลประวัติจาก API =====
  const fetchData = async () => {
    try {
      const data = await getHistory();
      setList(data);
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลได้");
    }
  };

  useEffect(() => {
    subscribe();
    fetchData();
    return () => unsubscribe();
  }, []);

  // ===== ฟังก์ชันบันทึกข้อมูลลงฐานข้อมูล =====
  const handleSave = async () => {
    try {
      setSaving(true);
      const status = getStatus(lux);
      const result = await addLight(lux, status);

      if (result.success) {
        Alert.alert("สำเร็จ", "บันทึกข้อมูลสำเร็จ");
        fetchData(); // โหลดประวัติใหม่
      } else {
        Alert.alert("ผิดพลาด", result.message);
      }
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถเชื่อมต่อ API ได้");
    } finally {
      setSaving(false);
    }
  };

  // ===== ฟังก์ชันลบข้อมูล =====
  const handleDelete = (id: number) => {
    Alert.alert("ยืนยัน", "ต้องการลบข้อมูลนี้หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: async () => {
          try {
            const result = await deleteLight(id);
            if (result.success) {
              fetchData(); // โหลดประวัติใหม่
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

  // ===== กำหนดสถานะปัจจุบัน =====
  const currentStatus = getStatus(lux);

  // ===== แสดงข้อมูลแต่ละรายการในประวัติ =====
  const renderItem = ({ item }: { item: LightHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyRow}>
        {/* ข้อมูลฝั่งซ้าย */}
        <View style={styles.historyInfo}>
          <Text style={styles.historyLux}>{item.lux} Lux</Text>
          <Text style={styles.historyStatus}>{item.status}</Text>
          <Text style={styles.historyTime}>{item.created_at}</Text>
        </View>

        {/* ปุ่มลบฝั่งขวา */}
        <View style={styles.historyAction}>
          <Button title="ลบ" color="#e74c3c" onPress={() => handleDelete(item.id)} />
        </View>
      </View>
    </View>
  );

  // ===== ส่วนหัวของหน้า (Sensor + ปุ่มบันทึก + หัวข้อประวัติ) =====
  const renderHeader = () => (
    <View>
      {/* ===== ส่วน Sensor ===== */}
      <View style={styles.sensorSection}>
        {/* หัวข้อ */}
        <Text style={styles.title}>Light Sensor</Text>

        {/* ค่า Lux */}
        <View style={styles.luxCard}>
          <Text style={styles.luxLabel}>ค่าแสงปัจจุบัน</Text>
          <Text style={styles.luxValue}>
            {Platform.OS === "android" ? lux.toFixed(2) : "ใช้ได้เฉพาะ Android"}
          </Text>
          <Text style={styles.luxUnit}>Lux</Text>
        </View>

        {/* สถานะ */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>สถานะ</Text>
          <Text style={styles.statusValue}>
            {Platform.OS === "android" ? currentStatus : "-"}
          </Text>
        </View>

        {/* ปุ่มบันทึก */}
        <View style={styles.saveButton}>
          <Button
            title={saving ? "กำลังบันทึก..." : "💾 บันทึกข้อมูล"}
            onPress={handleSave}
            disabled={saving}
            color="#2ecc71"
          />
        </View>
      </View>

      {/* ===== เส้นแบ่ง ===== */}
      <View style={styles.divider} />

      {/* ===== ส่วนหัวข้อประวัติ ===== */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>ประวัติข้อมูล</Text>
        <Text style={styles.historyCount}>ทั้งหมด {list.length} รายการ</Text>
      </View>


      {/* แสดงเมื่อไม่มีข้อมูล */}
      {list.length === 0 ? (
        <Text style={styles.statusText}>ไม่มีข้อมูล</Text>
      ) : null}
    </View>
  );

  // ===== ส่วนท้าย (ปุ่ม Refresh) =====
  const renderFooter = () => (
    <View style={styles.refreshButton}>
      <Button title="🔄 Refresh" onPress={fetchData} color="#3498db" />
    </View>
  );

  // ===== แสดงหน้าจอ =====
  return (
    <FlatList
      style={styles.container}
      data={list}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  sensorSection: {
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#000",
  },
  luxCard: {
    padding: 20,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  luxLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  luxValue: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#000",
  },
  luxUnit: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  statusCard: {
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  statusLabel: {
    fontSize: 16,
    color: "#666",
  },
  statusValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  saveButton: {
    marginTop: 8,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#ccc",
    marginVertical: 20,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  historyCount: {
    fontSize: 14,
    color: "#666",
  },
  refreshButton: {
    marginBottom: 12,
  },
  statusText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
    marginBottom: 10,
  },
  historyItem: {
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyLux: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 2,
  },
  historyStatus: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: "#999",
  },
  historyAction: {
    marginLeft: 10,
  },
});