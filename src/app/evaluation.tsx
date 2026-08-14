import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { getHistory } from "../services/api";
import { LightHistory } from "../types/types";

export default function ActivityEvaluation() {
  const [historyList, setHistoryList] = useState<LightHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
  const [activity, setActivity] = useState("reading");

  // ===== ฟังก์ชันดึงข้อมูลจาก API =====
  const fetchData = async () => {
    try {
      const data = await getHistory();
      setHistoryList(data);

      // ถ้ามีข้อมูล ให้เลือกข้อมูลแรกเป็นค่าเริ่มต้น
      if (data.length > 0 && selectedHistoryId === null) {
        setSelectedHistoryId(data[0].id);
      }
    } catch (error) {
      Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลได้");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===== ฟังก์ชันหาชื่อกิจกรรม =====
  const getActivityName = (act: string): string => {
    if (act === "reading") return "📖 อ่านหนังสือ";
    if (act === "computer") return "💻 ทำงานหน้าคอม";
    if (act === "writing") return "✍ เขียนหนังสือ";
    if (act === "phone") return "📱 เล่นโทรศัพท์";
    return "😴 นอนพัก";
  };

  // ===== ฟังก์ชันหาช่วง Lux ที่เหมาะสม =====
  const getSuitableRange = (act: string): { min: number; max: number } => {
    if (act === "reading") return { min: 300, max: 500 };
    if (act === "computer") return { min: 300, max: 500 };
    if (act === "writing") return { min: 400, max: 600 };
    if (act === "phone") return { min: 100, max: 300 };
    return { min: 0, max: 50 }; // นอนพัก
  };

  // ===== ฟังก์ชันประเมินผล =====
  const getEvaluation = (lux: number, act: string): { text: string; suitable: boolean } => {
    const range = getSuitableRange(act);
    if (lux >= range.min && lux <= range.max) {
      return { text: "✅ เหมาะสม", suitable: true };
    }
    return { text: "❌ ไม่เหมาะสม", suitable: false };
  };

  // ===== ฟังก์ชันคำนวณคะแนน =====
  const getQualityScore = (lux: number, act: string): number => {
    const range = getSuitableRange(act);
    if (lux >= range.min && lux <= range.max) return 100;

    let distance = 0;
    if (lux < range.min) {
      distance = range.min - lux;
    } else {
      distance = lux - range.max;
    }

    if (distance <= 100) return 80;
    if (distance <= 300) return 60;
    return 40;
  };

  // ===== ฟังก์ชันแนะนำ =====
  const getRecommendation = (lux: number, act: string): string => {
    const range = getSuitableRange(act);
    const name = getActivityName(act);

    if (lux >= range.min && lux <= range.max) {
      return "✅ เหมาะสำหรับ" + name + "\nช่วยลดอาการเมื่อยล้าของสายตา";
    } else if (lux < range.min) {
      return "⚠️ แสงน้อยเกินไป\nควรเปิดไฟเพิ่ม";
    } else {
      return "⚠️ แสงสว่างเกินไป\nควรลดแสงหรือเปลี่ยนตำแหน่งโต๊ะ";
    }
  };

  // ===== ฟังก์ชันแสดง Tips =====
  const getTips = (act: string): string => {
    if (act === "reading") {
      return "• พักสายตาทุก 20 นาที\n• นั่งห่างจากหนังสือประมาณ 30-40 ซม.\n• หลีกเลี่ยงแสงสะท้อน";
    } else if (act === "computer") {
      return "• ปรับความสว่างหน้าจอให้เหมาะสม\n• พักสายตาทุก 20 นาที\n• กระพริบตาบ่อย ๆ";
    } else if (act === "writing") {
      return "• ใช้ไฟส่องจากด้านซ้าย (ถ้าถนัดขวา)\n• หลีกเลี่ยงเงาบนกระดาษ";
    } else if (act === "phone") {
      return "• ลดความสว่างหน้าจอ\n• ไม่ควรเล่นในที่มืด";
    } else {
      return "• ลดแสงภายในห้อง\n• ปิดหน้าจอก่อนนอนอย่างน้อย 30 นาที";
    }
  };

  // ===== ฟังก์ชันจัดรูปแบบวันที่ =====
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${day}/${month}/${year}  ${hours}:${minutes}:${seconds}`;
  };

  // ===== คำนวณค่าต่าง ๆ =====
  const selectedHistory = historyList.find((h) => h.id === selectedHistoryId);
  const currentLux = selectedHistory ? selectedHistory.lux : 0;

  const range = getSuitableRange(activity);
  const evaluation = getEvaluation(currentLux, activity);
  const score = getQualityScore(currentLux, activity);
  const recommendation = getRecommendation(currentLux, activity);
  const tips = getTips(activity);

  // ===== สีตามคะแนน =====
  const getScoreColor = (s: number) => {
    if (s >= 100) return "#10B981";
    if (s >= 80) return "#0D9488";
    if (s >= 60) return "#F59E0B";
    return "#EF4444";
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Title */}
      <Text style={styles.title}>🔬 การประเมินกิจกรรม</Text>

      {/* Picker: เลือกข้อมูลประวัติ */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>📂 เลือกข้อมูลที่บันทึกไว้</Text>
        <View style={styles.pickerWrapper}>
          {historyList.length === 0 ? (
            <Text style={styles.emptyText}>ไม่มีข้อมูล</Text>
          ) : (
            <Picker
              selectedValue={selectedHistoryId}
              onValueChange={(value) => setSelectedHistoryId(value)}
              style={styles.picker}
              dropdownIconColor="#6B7280"
            >
              {historyList.map((item) => (
                <Picker.Item
                  key={item.id}
                  label={`${item.lux} Lux - ${formatDate(item.created_at)}`}
                  value={item.id}
                  color="#374151"
                />
              ))}
            </Picker>
          )}
        </View>
      </View>

      {/* Lux Display */}
      <View style={styles.luxCard}>
        <Text style={styles.luxLabel}>ค่าความสว่างที่ประเมิน</Text>
        <View style={styles.luxRow}>
          <Text style={styles.luxValue}>{currentLux}</Text>
          <Text style={styles.luxUnit}>Lux</Text>
        </View>
      </View>

      {/* Picker: เลือกกิจกรรม */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>🎯 เลือกกิจกรรม</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={activity}
            onValueChange={(value) => setActivity(value)}
            style={styles.picker}
            dropdownIconColor="#6B7280"
          >
            <Picker.Item label="📖 อ่านหนังสือ" value="reading" color="#374151" />
            <Picker.Item label="💻 ทำงานหน้าคอม" value="computer" color="#374151" />
            <Picker.Item label="✍ เขียนหนังสือ" value="writing" color="#374151" />
            <Picker.Item label="📱 เล่นโทรศัพท์" value="phone" color="#374151" />
            <Picker.Item label="😴 นอนพัก" value="sleep" color="#374151" />
          </Picker>
        </View>
      </View>

      {/* Activity + Range */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>กิจกรรมที่เลือก</Text>
        <Text style={styles.cardValue}>{getActivityName(activity)}</Text>
        <View style={styles.rangeBadge}>
          <Text style={styles.rangeText}>
            ช่วงที่เหมาะสม: {range.min}–{range.max} Lux
          </Text>
        </View>
      </View>

      {/* Evaluation Result */}
      <View style={[styles.resultCard, { borderColor: evaluation.suitable ? "#10B981" : "#EF4444" }]}>
        <Text style={styles.cardLabel}>ผลการประเมิน</Text>
        <Text style={[styles.resultText, { color: evaluation.suitable ? "#10B981" : "#EF4444" }]}>
          {evaluation.text}
        </Text>
      </View>

      {/* Quality Score */}
      <View style={styles.scoreCard}>
        <Text style={styles.cardLabel}>คะแนนคุณภาพแสง</Text>
        <View style={styles.scoreRow}>
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: getScoreColor(score) }]} />
        </View>
      </View>

      {/* Recommendation */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>💡 คำแนะนำ</Text>
        <Text style={styles.recommendText}>{recommendation}</Text>
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardLabel}>📝 เคล็ดลับ</Text>
        <Text style={styles.tipsText}>{tips}</Text>
      </View>

      {/* Refresh */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} activeOpacity={0.7}>
        <Text style={styles.refreshBtnText}>🔄 รีเฟรช</Text>
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

  // Card base
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  cardLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 8,
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
  },

  // Picker
  pickerWrapper: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  picker: {
    width: "100%",
    color: "#374151",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    padding: 16,
    textAlign: "center",
  },

  // Lux display
  luxCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 14,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0D9488",
    elevation: 2,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  luxLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  luxRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  luxValue: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#0D9488",
  },
  luxUnit: {
    fontSize: 18,
    color: "#9CA3AF",
    marginBottom: 6,
    marginLeft: 6,
    fontWeight: "600",
  },

  // Range badge
  rangeBadge: {
    backgroundColor: "#F0FDFA",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 10,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  rangeText: {
    fontSize: 13,
    color: "#0D9488",
    fontWeight: "500",
  },

  // Result
  resultCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  resultText: {
    fontSize: 22,
    fontWeight: "bold",
  },

  // Score
  scoreCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: "bold",
  },
  scoreMax: {
    fontSize: 18,
    color: "#9CA3AF",
    marginBottom: 4,
    marginLeft: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },

  // Recommendation
  recommendText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },

  // Tips
  tipsCard: {
    backgroundColor: "#F0FDFA",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  tipsText: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 26,
  },

  // Refresh
  refreshBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0D9488",
  },
  refreshBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0D9488",
  },
});