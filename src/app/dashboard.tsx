import { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from "react-native";
import { LightSensor } from "expo-sensors";
import { addLight, getHistory, deleteLight } from "../services/api";
import { getStatus } from "../utils/helpers";
import { LightHistory } from "../types/types";

export default function Dashboard() {
  const [lux, setLux] = useState(0);
  const [subscription, setSubscription] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [list, setList] = useState<LightHistory[]>([]);

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
        fetchData();
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

  // ===== กำหนดสถานะปัจจุบัน =====
  const currentStatus = getStatus(lux);

  // ===== สีของสถานะ =====
  const getStatusColor = (status: string) => {
    if (status === "มืด") return "#EF4444";
    if (status === "สลัว") return "#F59E0B";
    if (status === "สว่างปกติ") return "#10B981";
    return "#3B82F6";
  };

  // ===== แสดงข้อมูลแต่ละรายการในประวัติ =====
  const renderItem = ({ item }: { item: LightHistory }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyRow}>
        <View style={styles.historyInfo}>
          <View style={styles.historyLuxRow}>
            <Text style={styles.historyLux}>{item.lux}</Text>
            <Text style={styles.historyLuxUnit}> Lux</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + "15", borderColor: getStatusColor(item.status) }]}>
            <Text style={[styles.statusBadgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
          </View>
          <Text style={styles.historyTime}>{item.created_at}</Text>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item.id)}>
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ===== ส่วนหัวของหน้า =====
  const renderHeader = () => (
    <View>
      {/* Sensor Card */}
      <View style={styles.sensorCard}>
        <Text style={styles.sensorLabel}>ค่าแสงปัจจุบัน</Text>
        <View style={styles.luxDisplay}>
          <Text style={styles.luxValue}>
            {Platform.OS === "android" ? lux.toFixed(1) : "—"}
          </Text>
          <Text style={styles.luxUnit}>Lux</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.currentStatusBadge, { backgroundColor: getStatusColor(currentStatus) + "15" }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(currentStatus) }]} />
          <Text style={[styles.currentStatusText, { color: getStatusColor(currentStatus) }]}>
            {Platform.OS === "android" ? currentStatus : "ใช้ได้เฉพาะ Android"}
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.8}
      >
        <Text style={styles.saveBtnText}>
          {saving ? "⏳ กำลังบันทึก..." : "💾 บันทึกข้อมูล"}
        </Text>
      </TouchableOpacity>

      {/* History Header */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>📋 ประวัติข้อมูล</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{list.length}</Text>
        </View>
      </View>

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} activeOpacity={0.7}>
        <Text style={styles.refreshBtnText}>🔄 รีเฟรช</Text>
      </TouchableOpacity>

      {list.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📭</Text>
          <Text style={styles.emptyText}>ยังไม่มีข้อมูล</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={list}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderItem}
      ListHeaderComponent={renderHeader}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  listContent: {
    padding: 20,
    paddingBottom: 30,
  },

  // Sensor Card
  sensorCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  sensorLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  luxDisplay: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  luxValue: {
    fontSize: 52,
    fontWeight: "bold",
    color: "#1F2937",
  },
  luxUnit: {
    fontSize: 20,
    color: "#9CA3AF",
    marginBottom: 8,
    marginLeft: 6,
    fontWeight: "600",
  },

  // Status
  currentStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  currentStatusText: {
    fontSize: 15,
    fontWeight: "600",
  },

  // Save Button
  saveBtn: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  saveBtnDisabled: {
    backgroundColor: "#D1D5DB",
  },
  saveBtnText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // History Header
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
    flex: 1,
  },
  countBadge: {
    backgroundColor: "#0D9488",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: "center",
  },
  countBadgeText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  // Refresh
  refreshBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#0D9488",
  },
  refreshBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0D9488",
  },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#9CA3AF",
  },

  // History Item
  historyItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyInfo: {
    flex: 1,
  },
  historyLuxRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 6,
  },
  historyLux: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1F2937",
  },
  historyLuxUnit: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  historyTime: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Delete Button
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  deleteButtonText: {
    fontSize: 18,
  },
});