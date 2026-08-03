import { View, Text, StyleSheet, ScrollView } from "react-native";

export default function Home() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.iconCircle}>
          <Text style={styles.heroIcon}>💡</Text>
        </View>
        <Text style={styles.title}>Smart Light Sensor</Text>
        <Text style={styles.subtitle}>
          แอปพลิเคชันวัดและประเมินคุณภาพแสงสว่าง
        </Text>
      </View>

      {/* Feature Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📌 ฟีเจอร์หลัก</Text>
      </View>

      {/* Dashboard Feature */}
      <View style={styles.featureCard}>
        <View style={styles.featureIconBox}>
          <Text style={styles.featureIconText}>📊</Text>
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureName}>Dashboard</Text>
          <Text style={styles.featureLabel}>แดชบอร์ด</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureDesc}>• วัดค่าความสว่าง (Lux) แบบ Real-time</Text>
            <Text style={styles.featureDesc}>• บันทึกข้อมูลระดับแสงลงฐานข้อมูล</Text>
            <Text style={styles.featureDesc}>• ดูประวัติการบันทึกแสงล่าสุด</Text>
          </View>
        </View>
      </View>

      {/* Evaluate Feature */}
      <View style={styles.featureCard}>
        <View style={[styles.featureIconBox, { backgroundColor: "#EDE9FE" }]}>
          <Text style={styles.featureIconText}>📋</Text>
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureName}>Evaluate</Text>
          <Text style={styles.featureLabel}>ประเมินกิจกรรม</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureDesc}>• นำข้อมูลแสงที่บันทึกไว้มาประเมิน</Text>
            <Text style={styles.featureDesc}>• วิเคราะห์ว่าแสงเหมาะกับกิจกรรมหรือไม่</Text>
            <Text style={styles.featureDesc}>• คำแนะนำและเคล็ดลับถนอมสายตา</Text>
          </View>
        </View>
      </View>

      {/* Monitoring Feature */}
      <View style={styles.featureCard}>
        <View style={[styles.featureIconBox, { backgroundColor: "#D1FAE5" }]}>
          <Text style={styles.featureIconText}>🔍</Text>
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureName}>Monitoring</Text>
          <Text style={styles.featureLabel}>ตรวจสอบระบบ</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureDesc}>• ตรวจสอบการทำงานของ Light Sensor</Text>
            <Text style={styles.featureDesc}>• ตรวจสอบสถานะการเชื่อมต่อ API</Text>
            <Text style={styles.featureDesc}>• ตรวจสอบสถานะฐานข้อมูล</Text>
          </View>
        </View>
      </View>
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

  // Hero
  heroSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#0D9488",
  },
  heroIcon: {
    fontSize: 36,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  // Section
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#374151",
  },

  // Feature Card
  featureCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  featureIconBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  featureIconText: {
    fontSize: 24,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0D9488",
    marginBottom: 2,
  },
  featureLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
  },
  featureList: {
    gap: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 20,
  },
});
