// ===== index.tsx =====
// หน้าแรก (Home) - แนะนำแอปพลิเคชันและฟีเจอร์ต่าง ๆ

import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function Home() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💡 Smart Light Sensor</Text>
        <Text style={styles.subtitle}>แอปพลิเคชันวัดและประเมินคุณภาพแสงสว่าง</Text>
      </View>

      <View style={styles.box}>
        <Text style={styles.boxTitle}>📌 ฟีเจอร์หลักของแอปพลิเคชัน</Text>
        
        <View style={styles.featureItem}>
          <Text style={styles.featureName}>1. Dashboard (แดชบอร์ด)</Text>
          <Text style={styles.featureDesc}>- วัดค่าความสว่าง (Lux) แบบ Real-time</Text>
          <Text style={styles.featureDesc}>- บันทึกข้อมูลระดับแสงลงฐานข้อมูล</Text>
          <Text style={styles.featureDesc}>- ดูประวัติการบันทึกแสงล่าสุด</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureName}>2. Evaluate (ประเมินกิจกรรม)</Text>
          <Text style={styles.featureDesc}>- นำข้อมูลแสงที่บันทึกไว้มาประเมิน</Text>
          <Text style={styles.featureDesc}>- วิเคราะห์ว่าแสงเหมาะสมกับกิจกรรมหรือไม่ (เช่น อ่านหนังสือ, ทำงานหน้าคอม)</Text>
          <Text style={styles.featureDesc}>- คำแนะนำและเคล็ดลับถนอมสายตา</Text>
        </View>

        <View style={styles.featureItem}>
          <Text style={styles.featureName}>3. Monitoring (ตรวจสอบระบบ)</Text>
          <Text style={styles.featureDesc}>- ตรวจสอบการทำงานของ Light Sensor</Text>
          <Text style={styles.featureDesc}>- ตรวจสอบสถานะการเชื่อมต่อ API</Text>
          <Text style={styles.featureDesc}>- ตรวจสอบสถานะฐานข้อมูล (Database)</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>เลือกเมนูด้านล่างเพื่อเริ่มต้นใช้งาน 👇</Text>
      </View>
      
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f0f2f5",
  },
  header: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7f8c8d",
    textAlign: "center",
  },
  box: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  boxTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  featureItem: {
    marginBottom: 15,
  },
  featureName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
    marginBottom: 3,
  },
  footer: {
    alignItems: "center",
    marginTop: 10,
  },
  footerText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#e67e22",
  },
});
