import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, ScrollView, Platform } from "react-native";
import { LightSensor } from "expo-sensors";
import { getMonitoring } from "../services/api";

export default function MonitoringDashboard() {
  const [sensorOnline, setSensorOnline] = useState(false); // สถานะ Sensor (true = ทำงาน, false = ไม่ทำงาน)
  const [apiConnected, setApiConnected] = useState(false); // สถานะ API (true = เชื่อมต่อได้, false = เชื่อมต่อไม่ได้)
  const [dbConnected, setDbConnected] = useState(false); // สถานะ Database (true = เชื่อมต่อได้, false = เชื่อมต่อไม่ได้)

  // ===== ฟังก์ชันตรวจสอบ Sensor =====
  const checkSensor = () => {
    LightSensor.setUpdateInterval(2000);
    const sub = LightSensor.addListener((data) => {
      setSensorOnline(true);
    });
    return sub;
  };

  // ===== ฟังก์ชันดึงข้อมูลจาก API =====
  const fetchMonitoring = async () => {
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
        <Button title="🔄 Refresh" onPress={fetchMonitoring} color="#3498db" />
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
