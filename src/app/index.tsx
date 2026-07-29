import { View, Text, StyleSheet } from "react-native";

export default function Home() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💡 Light Sensor</Text>
      <Text style={styles.subtitle}>วัดแสงรอบตัวคุณ</Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>📱 อ่านค่า Lux แบบ Real-time</Text>
        <Text style={styles.cardText}>💾 บันทึกลงฐานข้อมูล</Text>
        <Text style={styles.cardText}>📋 ดูประวัติย้อนหลัง</Text>
        <Text style={styles.cardText}>📊 สรุปสถิติ</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "100%",
    gap: 12,
  },
  cardText: {
    fontSize: 16,
    color: "#333",
  },
});
