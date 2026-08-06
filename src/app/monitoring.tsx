import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { LightSensor } from "expo-sensors";
import { getMonitoring } from "../services/api";

export default function MonitoringDashboard() {
  const [sensorOnline, setSensorOnline] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // ===== ฟังก์ชันตรวจสอบ Sensor =====
  const checkSensor = () => {
    LightSensor.setUpdateInterval(2000);
    const sub = LightSensor.addListener((data) => {
      setSensorOnline(true);
    });
    return sub;
  };
  //hfgfdh dtjgjdfyffr

  // ===== ฟังก์ชันดึงข้อมูลจาก API =====
  const fetchMonitoring = async () => {
    setLoading(true);
    try {
      const data = await getMonitoring();
      setApiConnected(true);
      if (data) {
        setDbConnected(true);
      } else {
        setDbConnected(false);
      }
    } catch (error) {
      setApiConnected(false);
      setDbConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();

    let sub: any = null;
    if (Platform.OS === "android") {
      sub = checkSensor();
    }

    return () => {
      if (sub) {
        sub.remove();
      }
    };
  }, []);

  // สถานะรวม
  const allOnline = sensorOnline && apiConnected && dbConnected;
  const partialOnline = sensorOnline || apiConnected || dbConnected;

  const getOverallStatus = () => {
    if (allOnline) return { text: "ระบบทำงานปกติ", color: "#10B981", icon: "✅", bg: "#F0FDF4" };
    if (partialOnline) return { text: "บางระบบมีปัญหา", color: "#F59E0B", icon: "⚠️", bg: "#FFFBEB" };
    return { text: "ระบบไม่พร้อมใช้งาน", color: "#EF4444", icon: "🔴", bg: "#FEF2F2" };
  };

  const overall = getOverallStatus();

  // ===== Status Card Component =====
  const StatusCard = ({ title, icon, online }: { title: string; icon: string; online: boolean }) => (
    <View style={[styles.statusCard, { borderColor: online ? "#10B981" : "#FCA5A5" }]}>
      <View style={styles.statusCardHeader}>
        <Text style={styles.statusIcon}>{icon}</Text>
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
      <View style={styles.statusBody}>
        <View style={[styles.statusIndicator, { backgroundColor: online ? "#10B981" : "#EF4444" }]} />
        <Text style={[styles.statusText, { color: online ? "#10B981" : "#EF4444" }]}>
          {online ? "Online" : "Offline"}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: online ? "#F0FDF4" : "#FEF2F2", borderColor: online ? "#BBF7D0" : "#FECACA" }]}>
        <Text style={[styles.statusBadgeText, { color: online ? "#10B981" : "#EF4444" }]}>
          {online ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.title}>⚙️ Monitoring Dashboard</Text>

      {/* Overall Status */}
      <View style={[styles.overallCard, { borderColor: overall.color, backgroundColor: overall.bg }]}>
        <Text style={styles.overallIcon}>{overall.icon}</Text>
        <Text style={[styles.overallText, { color: overall.color }]}>{overall.text}</Text>
        <Text style={styles.overallSub}>
          {allOnline ? "ระบบทั้งหมดพร้อมใช้งาน" : "กรุณาตรวจสอบระบบที่มีปัญหา"}
        </Text>
      </View>

      {/* Status Cards */}
      <StatusCard title="Light Sensor" icon="📡" online={sensorOnline} />
      <StatusCard title="API Server" icon="🌐" online={apiConnected} />
      <StatusCard title="Database" icon="🗄️" online={dbConnected} />

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchMonitoring} activeOpacity={0.7}>
        <Text style={styles.refreshBtnText}>🔄 ตรวจสอบอีกครั้ง</Text>
      </TouchableOpacity>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#1F2937",
  },

  // Overall Card
  overallCard: {
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
  },
  overallIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  overallText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  overallSub: {
    fontSize: 13,
    color: "#6B7280",
  },

  // Status Card
  statusCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statusCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  statusIcon: {
    fontSize: 22,
    marginRight: 10,
  },
  statusTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#374151",
  },
  statusBody: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  statusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },

  // Refresh
  refreshBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#0D9488",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  refreshBtnText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0D9488",
  },
});
