// =============================================================================
// 📄 evaluation copy.tsx - หน้าประเมินความเหมาะสมของแสง (Lux) ต่อกิจกรรมต่าง ๆ
// =============================================================================
//
// 🔎 ภาพรวมการทำงานของหน้านี้:
//   หน้านี้เอาไว้ "ประเมิน" ว่าค่าความสว่าง (Lux) ที่เคยวัดและบันทึกไว้
//   นั้น "เหมาะสม" กับกิจกรรมที่ผู้ใช้เลือกหรือไม่
//   เช่น ถ้าค่า Lux = 400 และเลือกกิจกรรม "อ่านหนังสือ" (ช่วงเหมาะสม 300-500)
//   ระบบจะบอกว่า "เหมาะสม" พร้อมให้คะแนน 100/100
//
// 🔄 ลำดับการทำงาน (Flow):
//   1. เปิดหน้า → useEffect ทำงาน → เรียก fetchData() ดึงข้อมูลประวัติจาก API
//   2. ข้อมูลประวัติ (historyList) ถูกโหลดมาแสดงใน Picker ตัวแรก
//   3. ผู้ใช้เลือกข้อมูลประวัติ (ได้ค่า Lux) + เลือกกิจกรรม (Picker ตัวที่สอง)
//   4. ระบบคำนวณผลประเมินอัตโนมัติ (ทุกครั้งที่ state เปลี่ยน component จะ re-render)
//   5. แสดงผล: ค่า Lux → ช่วงเหมาะสม → ผลประเมิน → คะแนน → คำแนะนำ → เคล็ดลับ
//
// =============================================================================

// ===== 📦 Import Libraries =====
// useState: สร้างตัวแปร state เพื่อเก็บข้อมูลที่เปลี่ยนแปลงได้ (เช่น ข้อมูลที่เลือก)
// useEffect: ทำงานอัตโนมัติเมื่อ component ถูก mount (เปิดหน้า) ใช้ดึงข้อมูลจาก API
import { useState, useEffect } from "react";

// Import component ของ React Native สำหรับสร้าง UI
// - View: กล่องจัดวาง layout (เหมือน <div> ใน HTML)
// - Text: แสดงข้อความ (เหมือน <p> ใน HTML)
// - StyleSheet: สร้าง style object (เหมือน CSS)
// - TouchableOpacity: ปุ่มกดได้ มีเอฟเฟกต์จางเมื่อกด
// - ScrollView: พื้นที่เลื่อนได้ (ใช้เมื่อเนื้อหาเยอะกว่าจอ)
// - Alert: แสดง popup แจ้งเตือน
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";

// Picker: component dropdown สำหรับเลือกตัวเลือก (เหมือน <select> ใน HTML)
import { Picker } from "@react-native-picker/picker";

// getHistory: ฟังก์ชันเรียก API ดึงข้อมูลประวัติ Lux ทั้งหมดจากฐานข้อมูล
// (เรียก GET ไปที่ http://172.21.237.170/light_sensor/api/getHistory.php)
import { getHistory } from "../services/api";

// LightHistory: Type กำหนดโครงสร้างข้อมูลประวัติ
// มี 4 field: id (รหัส), lux (ค่าความสว่าง), status (สถานะ), created_at (วันที่บันทึก)
import { LightHistory } from "../types/types";

// =============================================================================
// 🏗️ Component หลัก: ActivityEvaluation
// =============================================================================
export default function ActivityEvaluation() {

  // ===== 🗃️ State Variables (ตัวแปรที่เก็บสถานะของหน้า) =====

  // historyList: เก็บรายการประวัติ Lux ทั้งหมดที่ดึงมาจาก API
  // เป็น array ของ LightHistory เช่น [{id: 1, lux: 350, status: "bright", created_at: "2026-08-10"}, ...]
  // ค่าเริ่มต้น: [] (array ว่าง เพราะยังไม่ได้โหลดข้อมูล)
  const [historyList, setHistoryList] = useState<LightHistory[]>([]);

  // selectedHistoryId: เก็บ id ของประวัติที่ผู้ใช้เลือกจาก Picker ตัวแรก
  // ใช้เพื่อค้นหาค่า Lux ที่จะนำมาประเมิน
  // ค่าเริ่มต้น: null (ยังไม่ได้เลือก)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

  // activity: เก็บกิจกรรมที่ผู้ใช้เลือกจาก Picker ตัวที่สอง
  // ค่าที่เป็นไปได้: "reading" | "computer" | "writing" | "phone" | "sleep"
  // ค่าเริ่มต้น: "reading" (อ่านหนังสือ)
  const [activity, setActivity] = useState("reading");

  // ===== 🌐 ฟังก์ชันดึงข้อมูลจาก API =====
  // เรียก getHistory() จาก api.ts เพื่อดึงข้อมูลประวัติ Lux ทั้งหมด
  // แล้วเก็บลง state historyList
  const fetchData = async () => {
    try {
      // เรียก API ดึงข้อมูลประวัติทั้งหมด (GET /getHistory.php)
      const data = await getHistory();
      // เก็บข้อมูลที่ได้ลง state
      setHistoryList(data);

      // ถ้ามีข้อมูล และยังไม่ได้เลือกข้อมูลใด ๆ (ครั้งแรก)
      // → เลือกข้อมูลแรก (data[0].id) เป็นค่าเริ่มต้นให้อัตโนมัติ
      if (data.length > 0 && selectedHistoryId === null) {
        setSelectedHistoryId(data[0].id);
      }
    } catch (error) {
      // ถ้าดึงข้อมูลไม่ได้ (เช่น เน็ตหลุด, server ล่ม) → แสดง Alert แจ้งเตือน
      Alert.alert("ผิดพลาด", "ไม่สามารถดึงข้อมูลได้");
    }
  };

  // ===== ⏱️ useEffect - ทำงานอัตโนมัติเมื่อเปิดหน้า =====
  // [] (dependency array ว่าง) = ทำงานแค่ครั้งเดียวตอน component mount (เปิดหน้า)
  // จุดเริ่มต้นของ flow ทั้งหมด: เรียก fetchData() เพื่อโหลดข้อมูล
  useEffect(() => {
    fetchData();
  }, []);

  // ===== 🏷️ ฟังก์ชันแปลง key กิจกรรมเป็นชื่อภาษาไทย + emoji =====
  // รับค่า act (เช่น "reading") แล้วคืนชื่อที่อ่านง่าย (เช่น "📖 อ่านหนังสือ")
  // ใช้แสดงใน UI และในข้อความคำแนะนำ
  const getActivityName = (act: string): string => {
    if (act === "reading") return "📖 อ่านหนังสือ";
    if (act === "computer") return "💻 ทำงานหน้าคอม";
    if (act === "writing") return "✍ เขียนหนังสือ";
    if (act === "phone") return "📱 เล่นโทรศัพท์";
    return "😴 นอนพัก"; // ค่า default ถ้าไม่ตรงกับอะไรเลย (กรณี "sleep")
  };

  // ===== 📊 ฟังก์ชันหาช่วง Lux ที่เหมาะสมของแต่ละกิจกรรม =====
  // คืนค่า { min, max } = ช่วงค่า Lux ที่แนะนำสำหรับกิจกรรมนั้น ๆ
  // อ้างอิงจากมาตรฐานความสว่างที่เหมาะสมกับการใช้สายตา
  // ตัวอย่าง: อ่านหนังสือ ควรอยู่ที่ 300-500 Lux
  const getSuitableRange = (act: string): { min: number; max: number } => {
    if (act === "reading") return { min: 300, max: 500 };   // อ่านหนังสือ: 300-500 Lux
    if (act === "computer") return { min: 300, max: 500 };  // ทำงานหน้าคอม: 300-500 Lux
    if (act === "writing") return { min: 400, max: 600 };   // เขียนหนังสือ: 400-600 Lux (ต้องการแสงมากกว่า)
    if (act === "phone") return { min: 100, max: 300 };     // เล่นโทรศัพท์: 100-300 Lux (แสงน้อยหน่อยก็ได้)
    return { min: 0, max: 50 };                              // นอนพัก: 0-50 Lux (ห้องมืด)
  };

  // ===== ✅/❌ ฟังก์ชันประเมินว่า Lux เหมาะสมกับกิจกรรมหรือไม่ =====
  // เปรียบเทียบค่า lux กับช่วง min-max ของกิจกรรม
  // คืน: { text: ข้อความแสดงผล, suitable: true/false }
  const getEvaluation = (lux: number, act: string): { text: string; suitable: boolean } => {
    const range = getSuitableRange(act);
    // ถ้า Lux อยู่ในช่วงที่เหมาะสม → "เหมาะสม"
    if (lux >= range.min && lux <= range.max) {
      return { text: "✅ เหมาะสม", suitable: true };
    }
    // ถ้า Lux อยู่นอกช่วง (น้อยเกินหรือมากเกิน) → "ไม่เหมาะสม"
    return { text: "❌ ไม่เหมาะสม", suitable: false };
  };

  // ===== 🎯 ฟังก์ชันคำนวณคะแนนคุณภาพแสง (0-100) =====
  // คำนวณว่าค่า Lux ห่างจากช่วงเหมาะสมมากน้อยแค่ไหน
  // ยิ่งห่าง → คะแนนยิ่งต่ำ
  //
  // เกณฑ์การให้คะแนน:
  //   - อยู่ในช่วง → 100 คะแนน (สมบูรณ์แบบ)
  //   - ห่างไม่เกิน 100 Lux → 80 คะแนน (ค่อนข้างดี)
  //   - ห่างไม่เกิน 300 Lux → 60 คะแนน (พอใช้)
  //   - ห่างเกิน 300 Lux → 40 คะแนน (ไม่ดี)
  const getQualityScore = (lux: number, act: string): number => {
    const range = getSuitableRange(act);
    // ถ้าอยู่ในช่วง → ได้ 100 คะแนนเต็ม
    if (lux >= range.min && lux <= range.max) return 100;

    // คำนวณระยะห่าง (distance) จากช่วงที่เหมาะสม
    let distance = 0;
    if (lux < range.min) {
      // Lux น้อยกว่า min → คำนวณว่าน้อยกว่าเท่าไหร่
      distance = range.min - lux;
    } else {
      // Lux มากกว่า max → คำนวณว่ามากกว่าเท่าไหร่
      distance = lux - range.max;
    }

    // ให้คะแนนตามระยะห่าง
    if (distance <= 100) return 80;  // ห่างนิดหน่อย
    if (distance <= 300) return 60;  // ห่างปานกลาง
    return 40;                        // ห่างมาก
  };

  // ===== 💡 ฟังก์ชันสร้างข้อความคำแนะนำ =====
  // ให้คำแนะนำตามผลประเมิน:
  //   - เหมาะสม → บอกว่าดีแล้ว
  //   - แสงน้อยเกินไป → แนะนำเปิดไฟเพิ่ม
  //   - แสงมากเกินไป → แนะนำลดแสง
  const getRecommendation = (lux: number, act: string): string => {
    const range = getSuitableRange(act);
    const name = getActivityName(act);

    if (lux >= range.min && lux <= range.max) {
      // อยู่ในช่วง → ข้อความบวก
      return "✅ เหมาะสำหรับ" + name + "\nช่วยลดอาการเมื่อยล้าของสายตา";
    } else if (lux < range.min) {
      // แสงน้อยกว่าที่ควร → แนะนำเปิดไฟเพิ่ม
      return "⚠️ แสงน้อยเกินไป\nควรเปิดไฟเพิ่ม";
    } else {
      // แสงมากกว่าที่ควร → แนะนำลดแสง
      return "⚠️ แสงสว่างเกินไป\nควรลดแสงหรือเปลี่ยนตำแหน่งโต๊ะ";
    }
  };

  // ===== 📝 ฟังก์ชันสร้างเคล็ดลับ (Tips) ตามกิจกรรม =====
  // แต่ละกิจกรรมมีเคล็ดลับดูแลสายตาที่แตกต่างกัน
  // แสดงเป็นข้อ ๆ ให้ผู้ใช้ปฏิบัติตาม
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
      // กรณี "sleep" (นอนพัก)
      return "• ลดแสงภายในห้อง\n• ปิดหน้าจอก่อนนอนอย่างน้อย 30 นาที";
    }
  };

  // ===== 📅 ฟังก์ชันจัดรูปแบบวันที่ให้อ่านง่าย =====
  // แปลงจาก "2026-08-10T17:00:00" → "10/08/2026  17:00:00"
  // ใช้แสดงใน Picker ตัวแรก เพื่อให้ผู้ใช้รู้ว่าข้อมูลนี้บันทึกเมื่อไหร่
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return "-"; // ถ้าไม่มีวันที่ → แสดง "-"
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");       // วัน: 01-31
    const month = String(d.getMonth() + 1).padStart(2, "0"); // เดือน: 01-12 (getMonth เริ่มจาก 0)
    const year = d.getFullYear();                            // ปี: เช่น 2026
    const hours = String(d.getHours()).padStart(2, "0");     // ชั่วโมง: 00-23
    const minutes = String(d.getMinutes()).padStart(2, "0"); // นาที: 00-59
    const seconds = String(d.getSeconds()).padStart(2, "0"); // วินาที: 00-59
    return `${day}/${month}/${year}  ${hours}:${minutes}:${seconds}`;
  };

  // =============================================================================
  // 🧮 Computed Values - ค่าที่คำนวณจาก state (ทำงานทุกครั้งที่ re-render)
  // =============================================================================
  // เมื่อผู้ใช้เปลี่ยน selectedHistoryId หรือ activity → component re-render
  // → ค่าเหล่านี้จะถูกคำนวณใหม่อัตโนมัติ → UI อัปเดตตาม

  // หาข้อมูลประวัติที่ตรงกับ id ที่เลือก จาก historyList
  const selectedHistory = historyList.find((h) => h.id === selectedHistoryId);
  // ดึงค่า Lux จากประวัติที่เลือก (ถ้าไม่มี → ใช้ 0)
  const currentLux = selectedHistory ? selectedHistory.lux : 0;

  // คำนวณค่าต่าง ๆ จาก currentLux + activity ที่เลือก
  const range = getSuitableRange(activity);                    // ช่วง Lux ที่เหมาะสม เช่น {min: 300, max: 500}
  const evaluation = getEvaluation(currentLux, activity);      // ผลประเมิน เช่น {text: "✅ เหมาะสม", suitable: true}
  const score = getQualityScore(currentLux, activity);         // คะแนน เช่น 100
  const recommendation = getRecommendation(currentLux, activity); // คำแนะนำ เช่น "✅ เหมาะสำหรับ📖 อ่านหนังสือ..."
  const tips = getTips(activity);                              // เคล็ดลับ เช่น "• พักสายตาทุก 20 นาที..."

  // ===== 🎨 ฟังก์ชันกำหนดสีตามคะแนน =====
  // ใช้แสดงสีตัวเลขคะแนนและ progress bar ให้สื่อความหมาย
  //   100 → เขียวสด (ดีมาก)
  //   80  → เขียวเข้ม (ดี)
  //   60  → เหลือง (พอใช้)
  //   40  → แดง (ไม่ดี)
  const getScoreColor = (s: number) => {
    if (s >= 100) return "#10B981"; // เขียวสด (Emerald)
    if (s >= 80) return "#0D9488";  // เขียวเข้ม (Teal)
    if (s >= 60) return "#F59E0B";  // เหลือง (Amber) - เตือน
    return "#EF4444";               // แดง (Red) - อันตราย
  };

  // =============================================================================
  // 🖼️ JSX - ส่วนแสดงผล UI
  // =============================================================================
  // เรียงลำดับจากบนลงล่าง ตาม flow การใช้งาน:
  //   1. หัวข้อ (Title)
  //   2. Picker เลือกข้อมูลประวัติ (เพื่อได้ค่า Lux)
  //   3. แสดงค่า Lux ที่เลือก
  //   4. Picker เลือกกิจกรรม
  //   5. แสดงกิจกรรมที่เลือก + ช่วง Lux ที่เหมาะสม
  //   6. ผลการประเมิน (เหมาะสม/ไม่เหมาะสม)
  //   7. คะแนนคุณภาพแสง + progress bar
  //   8. คำแนะนำ
  //   9. เคล็ดลับ
  //   10. ปุ่มรีเฟรช

  return (
    // ScrollView: ทำให้หน้าเลื่อนได้ เพราะเนื้อหาเยอะกว่า 1 จอ
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ===== 1. หัวข้อหน้า ===== */}
      <Text style={styles.title}>🔬 การประเมินกิจกรรม</Text>

      {/* ===== 2. Picker ตัวที่ 1: เลือกข้อมูลประวัติ Lux ที่บันทึกไว้ ===== */}
      {/* ผู้ใช้เลือกว่าจะเอาค่า Lux จากการวัดครั้งไหนมาประเมิน */}
      {/* แสดงเป็น "350 Lux - 10/08/2026 17:00:00" ให้เลือก */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>📂 เลือกข้อมูลที่บันทึกไว้</Text>
        <View style={styles.pickerWrapper}>
          {/* ถ้ายังไม่มีข้อมูลเลย → แสดงข้อความ "ไม่มีข้อมูล" */}
          {historyList.length === 0 ? (
            <Text style={styles.emptyText}>ไม่มีข้อมูล</Text>
          ) : (
            // มีข้อมูล → แสดง Picker ให้เลือก
            // เมื่อเลือก → setSelectedHistoryId อัปเดต state → component re-render → คำนวณค่าใหม่
            <Picker
              selectedValue={selectedHistoryId}
              onValueChange={(value) => setSelectedHistoryId(value)}
              style={styles.picker}
              dropdownIconColor="#6B7280"
            >
              {/* วนลูปแสดงทุกข้อมูลประวัติเป็นตัวเลือกใน Picker */}
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

      {/* ===== 3. แสดงค่า Lux ที่เลือก ===== */}
      {/* การ์ดขนาดใหญ่แสดงค่า Lux เด่น ๆ ให้ผู้ใช้เห็นชัด */}
      <View style={styles.luxCard}>
        <Text style={styles.luxLabel}>ค่าความสว่างที่ประเมิน</Text>
        <View style={styles.luxRow}>
          {/* currentLux: ค่าที่คำนวณมาจาก selectedHistoryId */}
          <Text style={styles.luxValue}>{currentLux}</Text>
          <Text style={styles.luxUnit}>Lux</Text>
        </View>
      </View>

      {/* ===== 4. Picker ตัวที่ 2: เลือกกิจกรรมที่จะประเมิน ===== */}
      {/* มี 5 กิจกรรมให้เลือก แต่ละอันมีช่วง Lux เหมาะสมต่างกัน */}
      {/* เมื่อเลือก → setActivity อัปเดต state → คำนวณผลใหม่ทันที */}
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

      {/* ===== 5. แสดงกิจกรรมที่เลือก + ช่วง Lux ที่เหมาะสม ===== */}
      {/* เช่น: "📖 อ่านหนังสือ" + badge "ช่วงที่เหมาะสม: 300–500 Lux" */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>กิจกรรมที่เลือก</Text>
        <Text style={styles.cardValue}>{getActivityName(activity)}</Text>
        {/* Badge แสดงช่วง Lux ที่เหมาะสม (สีเขียวอ่อน) */}
        <View style={styles.rangeBadge}>
          <Text style={styles.rangeText}>
            ช่วงที่เหมาะสม: {range.min}–{range.max} Lux
          </Text>
        </View>
      </View>

      {/* ===== 6. ผลการประเมิน (เหมาะสม / ไม่เหมาะสม) ===== */}
      {/* ขอบการ์ดเปลี่ยนสีตามผล: เขียว = เหมาะสม, แดง = ไม่เหมาะสม */}
      <View style={[styles.resultCard, { borderColor: evaluation.suitable ? "#10B981" : "#EF4444" }]}>
        <Text style={styles.cardLabel}>ผลการประเมิน</Text>
        {/* สีข้อความเปลี่ยนตามผลเช่นกัน */}
        <Text style={[styles.resultText, { color: evaluation.suitable ? "#10B981" : "#EF4444" }]}>
          {evaluation.text}
        </Text>
      </View>

      {/* ===== 7. คะแนนคุณภาพแสง + Progress Bar ===== */}
      {/* แสดงคะแนน 40-100 พร้อม progress bar แสดงระดับ */}
      <View style={styles.scoreCard}>
        <Text style={styles.cardLabel}>คะแนนคุณภาพแสง</Text>
        <View style={styles.scoreRow}>
          {/* คะแนนตัวเลขใหญ่ สีเปลี่ยนตามระดับ */}
          <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
        {/* Progress bar: แถบสีแสดงสัดส่วนคะแนน */}
        {/* ความกว้าง = score% ของแถบ, สีเปลี่ยนตามคะแนน */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${score}%`, backgroundColor: getScoreColor(score) }]} />
        </View>
      </View>

      {/* ===== 8. คำแนะนำ ===== */}
      {/* แสดงคำแนะนำที่คำนวณจาก getRecommendation() */}
      {/* เช่น "✅ เหมาะสำหรับ📖 อ่านหนังสือ" หรือ "⚠️ แสงน้อยเกินไป" */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>💡 คำแนะนำ</Text>
        <Text style={styles.recommendText}>{recommendation}</Text>
      </View>

      {/* ===== 9. เคล็ดลับดูแลสายตา ===== */}
      {/* แสดง tips ที่ต่างกันตามกิจกรรมที่เลือก */}
      {/* การ์ดสีเขียวอ่อนเพื่อดูน่าอ่าน */}
      <View style={styles.tipsCard}>
        <Text style={styles.cardLabel}>📝 เคล็ดลับ</Text>
        <Text style={styles.tipsText}>{tips}</Text>
      </View>

      {/* ===== 10. ปุ่มรีเฟรช ===== */}
      {/* กดแล้วเรียก fetchData() ดึงข้อมูลใหม่จาก API */}
      {/* ใช้เมื่อมีการบันทึกข้อมูลใหม่แล้วอยากเห็นข้อมูลล่าสุด */}
      <TouchableOpacity style={styles.refreshBtn} onPress={fetchData} activeOpacity={0.7}>
        <Text style={styles.refreshBtnText}>🔄 รีเฟรช</Text>
      </TouchableOpacity>

      {/* เว้นระยะด้านล่างเพื่อไม่ให้เนื้อหาชิด bottom ของจอ */}
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
  recommendText: {
    fontSize: 16,
    color: "#374151",
    lineHeight: 24,
  },
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