import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, ScrollView, Alert } from "react-native";
import { getHistory } from "../services/api";
import { LightHistory } from "../types/types";

export default function ActivityEvaluation() {
  const [historyList, setHistoryList] = useState<LightHistory[]>([]); // ข้อมูลประวัติทั้งหมด
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null); // ID ของประวัติที่เลือก
  const [activity, setActivity] = useState("reading"); // กิจกรรมที่เลือก
  
  // State สำหรับเปิด/ปิด Dropdown จำลอง
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);

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

  // ===== useEffect - ดึงข้อมูลเมื่อเปิดหน้า =====
  useEffect(() => {
    fetchData();
  }, []);

  // ===== ฟังก์ชันหาชื่อกิจกรรม =====
  const getActivityName = (act: string): string => {
    if (act === "reading") {
      return "📖 อ่านหนังสือ";
    } else if (act === "computer") {
      return "💻 ทำงานหน้าคอม";
    } else if (act === "writing") {
      return "✍ เขียนหนังสือ";
    } else if (act === "phone") {
      return "📱 เล่นโทรศัพท์";
    } else {
      return "😴 นอนพัก";
    }
  };

  // ===== ฟังก์ชันหาช่วง Lux ที่เหมาะสม =====
  const getSuitableRange = (act: string): { min: number; max: number } => {
    if (act === "reading") {
      return { min: 300, max: 500 };
    } else if (act === "computer") {
      return { min: 300, max: 500 };
    } else if (act === "writing") {
      return { min: 400, max: 600 };
    } else if (act === "phone") {
      return { min: 100, max: 300 };
    } else {
      return { min: 0, max: 50 }; // นอนพัก
    }
  };

  // ===== ฟังก์ชันประเมินผล =====
  const getEvaluation = (lux: number, act: string): string => {
    const range = getSuitableRange(act);
    if (lux >= range.min && lux <= range.max) {
      return "✅ เหมาะสม";
    } else {
      return "❌ ไม่เหมาะสม";
    }
  };

  // ===== ฟังก์ชันคำนวณคะแนน =====
  const getQualityScore = (lux: number, act: string): number => {
    const range = getSuitableRange(act);

    // อยู่ในช่วงที่เหมาะสม
    if (lux >= range.min && lux <= range.max) {
      return 100;
    }

    // คำนวณระยะห่างจากช่วงที่เหมาะสม
    let distance = 0;
    if (lux < range.min) {
      distance = range.min - lux;
    } else {
      distance = lux - range.max;
    }

    // ให้คะแนนตามระยะห่าง
    if (distance <= 100) {
      return 80; // ห่างเล็กน้อย
    } else if (distance <= 300) {
      return 60; // ห่างมาก
    } else {
      return 40; // ไม่เหมาะสม
    }
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
  // หาข้อมูลประวัติที่กำลังเลือกอยู่
  const selectedHistory = historyList.find((h) => h.id === selectedHistoryId);
  const currentLux = selectedHistory ? selectedHistory.lux : 0;

  const range = getSuitableRange(activity);
  const evaluation = getEvaluation(currentLux, activity);
  const score = getQualityScore(currentLux, activity);
  const recommendation = getRecommendation(currentLux, activity);
  const tips = getTips(activity);

  return (
    <ScrollView style={styles.container}>
      {/* หัวข้อหลัก */}
      <Text style={styles.title}>การประเมินกิจกรรม</Text>

      {/* เลือกข้อมูลประวัติ */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>เลือกข้อมูลที่บันทึกไว้</Text>
        <Button 
          title={selectedHistory ? `${selectedHistory.lux} Lux - ${formatDate(selectedHistory.created_at)} ⬇️` : "เลือกข้อมูล..."} 
          onPress={() => setShowHistoryDropdown(!showHistoryDropdown)} 
          color="#3498db"
        />
        
        {/* แสดงรายการเมื่อกดปุ่ม (Dropdown จำลอง) */}
        {showHistoryDropdown && (
          <View style={styles.dropdownList}>
            {historyList.length === 0 ? (
              <Text style={styles.tipsText}>ไม่มีข้อมูล</Text>
            ) : (
              historyList.map((item) => (
                <View key={item.id} style={styles.dropdownItem}>
                  <Button 
                    title={`${item.lux} Lux - ${formatDate(item.created_at)}`} 
                    onPress={() => {
                      setSelectedHistoryId(item.id);
                      setShowHistoryDropdown(false);
                    }} 
                    color={selectedHistoryId === item.id ? "#2ecc71" : "#7f8c8d"}
                  />
                </View>
              ))
            )}
          </View>
        )}
      </View>

      {/* Current Lux */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>ค่าความสว่างที่ประเมิน</Text>
        <Text style={styles.boxValue}>{currentLux} Lux</Text>
      </View>

      {/* เลือกกิจกรรม */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>เลือกกิจกรรม</Text>
        <Button 
          title={`${getActivityName(activity)} ⬇️`} 
          onPress={() => setShowActivityDropdown(!showActivityDropdown)} 
          color="#9b59b6"
        />

        {/* แสดงรายการกิจกรรมเมื่อกดปุ่ม (Dropdown จำลอง) */}
        {showActivityDropdown && (
          <View style={styles.dropdownList}>
            <View style={styles.dropdownItem}>
              <Button title="📖 อ่านหนังสือ" onPress={() => { setActivity("reading"); setShowActivityDropdown(false); }} color={activity === "reading" ? "#2ecc71" : "#7f8c8d"} />
            </View>
            <View style={styles.dropdownItem}>
              <Button title="💻 ทำงานหน้าคอม" onPress={() => { setActivity("computer"); setShowActivityDropdown(false); }} color={activity === "computer" ? "#2ecc71" : "#7f8c8d"} />
            </View>
            <View style={styles.dropdownItem}>
              <Button title="✍ เขียนหนังสือ" onPress={() => { setActivity("writing"); setShowActivityDropdown(false); }} color={activity === "writing" ? "#2ecc71" : "#7f8c8d"} />
            </View>
            <View style={styles.dropdownItem}>
              <Button title="📱 เล่นโทรศัพท์" onPress={() => { setActivity("phone"); setShowActivityDropdown(false); }} color={activity === "phone" ? "#2ecc71" : "#7f8c8d"} />
            </View>
            <View style={styles.dropdownItem}>
              <Button title="😴 นอนพัก" onPress={() => { setActivity("sleep"); setShowActivityDropdown(false); }} color={activity === "sleep" ? "#2ecc71" : "#7f8c8d"} />
            </View>
          </View>
        )}
      </View>

      {/* Selected Activity */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>กิจกรรมที่เลือก</Text>
        <Text style={styles.boxValue}>{getActivityName(activity)}</Text>
        <Text style={styles.rangeText}>
          ช่วงที่เหมาะสม: {range.min}-{range.max} Lux
        </Text>
      </View>

      {/* Evaluation Result */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>ผลการประเมิน</Text>
        <Text style={styles.boxValue}>{evaluation}</Text>
      </View>

      {/* Quality Score */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>คะแนนคุณภาพแสง</Text>
        <Text style={styles.boxValue}>{score} /100</Text>
      </View>

      {/* Recommendation */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>คำแนะนำ</Text>
        <Text style={styles.boxValue}>{recommendation}</Text>
      </View>

      {/* Tips */}
      <View style={styles.box}>
        <Text style={styles.boxTitle}>เคล็ดลับ</Text>
        <Text style={styles.tipsText}>{tips}</Text>
      </View>



      {/* ปุ่ม Refresh */}
      <View style={styles.buttonContainer}>
        <Button title="🔄 Refresh" onPress={fetchData} color="#3498db" />
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
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
  rangeText: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  dropdownList: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    paddingTop: 10,
  },
  dropdownItem: {
    marginBottom: 6,
  },
  tipsText: {
    fontSize: 16,
    color: "#000",
    lineHeight: 26,
  },
  buttonContainer: {
    marginTop: 10,
  },
});