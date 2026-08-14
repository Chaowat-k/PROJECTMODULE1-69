import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from "react-native";
import { LightSensor } from "expo-sensors";
import { getMonitoring, getHistory, addLight, deleteLight } from "../services/api";
import { getStatus } from "../utils/helpers";

// ===== Type กลาง =====
type TestStatus = "idle" | "testing" | "pass" | "fail";

// ===== Helper: mapping สีตาม status =====
const statusColorMap = {
  pass:    { border: "#10B981", text: "#10B981", bg: "#F0FDF4", badgeBorder: "#BBF7D0", icon: "✅", label: "ผ่าน" },
  fail:    { border: "#EF4444", text: "#EF4444", bg: "#FEF2F2", badgeBorder: "#FECACA", icon: "❌", label: "ไม่ผ่าน" },
  testing: { border: "#F59E0B", text: "#F59E0B", bg: "#FFFBEB", badgeBorder: "#FDE68A", icon: "⏳", label: "กำลังทดสอบ" },
  idle:    { border: "#E5E7EB", text: "#6B7280", bg: "#F9FAFB", badgeBorder: "#E5E7EB", icon: "⬜", label: "รอทดสอบ" },
};

// ===== Helper: รันทดสอบ API พร้อมจับเวลา =====
const runTimedTest = async (
  apiCall: () => Promise<{ success: boolean }>,
  setStatus: (s: TestStatus) => void,
  setTime: (t: number) => void,
) => {
  setStatus("testing");
  const start = Date.now();
  try {
    const result = await apiCall();
    setTime(Date.now() - start);
    setStatus(result.success ? "pass" : "fail");
  } catch {
    setTime(Date.now() - start);
    setStatus("fail");
  }
};

// ===== Helper: รันชุดทดสอบ logic แล้วสรุปผล =====
const runLogicTests = <T extends { label: string }>(
  tests: T[],
  checker: (t: T) => boolean,
): { passed: number; total: number; details: string } => {
  let passed = 0;
  const lines: string[] = [];
  tests.forEach((t) => {
    const ok = checker(t);
    if (ok) { passed++; lines.push(`✅ ${t.label}`); }
    else { lines.push(`❌ ${t.label}`); }
  });
  return {
    passed,
    total: tests.length,
    details: `ผ่าน ${passed}/${tests.length}\n` + lines.join("\n"),
  };
};

// ===== ฟังก์ชันหาช่วง Lux ที่เหมาะสม =====
const getSuitableRange = (act: string): { min: number; max: number } => {
  const ranges: Record<string, { min: number; max: number }> = {
    reading:  { min: 300, max: 500 },
    computer: { min: 300, max: 500 },
    writing:  { min: 400, max: 600 },
    phone:    { min: 100, max: 300 },
  };
  return ranges[act] || { min: 0, max: 50 }; // นอนพัก
};

// ===== Component: StatusCard =====
const StatusCard = ({ title, icon, online }: { title: string; icon: string; online: boolean }) => (
  <View style={[s.statusCard, { borderColor: online ? "#10B981" : "#FCA5A5" }]}>
    <View style={s.statusCardHeader}>
      <Text style={s.statusIcon}>{icon}</Text>
      <Text style={s.statusTitle}>{title}</Text>
    </View>
    <View style={s.statusBody}>
      <View style={[s.statusIndicator, { backgroundColor: online ? "#10B981" : "#EF4444" }]} />
      <Text style={[s.statusText, { color: online ? "#10B981" : "#EF4444" }]}>
        {online ? "Online" : "Offline"}
      </Text>
    </View>
    <View style={[s.statusBadge, { backgroundColor: online ? "#F0FDF4" : "#FEF2F2", borderColor: online ? "#BBF7D0" : "#FECACA" }]}>
      <Text style={[s.statusBadgeText, { color: online ? "#10B981" : "#EF4444" }]}>
        {online ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
      </Text>
    </View>
  </View>
);

// ===== Component: TestResultCard =====
const TestResultCard = ({ title, status, details, onTest }: {
  title: string; status: TestStatus; details: string; onTest: () => void;
}) => {
  const c = statusColorMap[status];
  return (
    <View style={[s.testCard, { borderColor: c.border }]}>
      <View style={s.testCardHeader}>
        <Text style={s.testCardTitle}>{title}</Text>
        <Text style={{ fontSize: 18 }}>{c.icon}</Text>
      </View>
      <View style={[s.testStatusBadge, { backgroundColor: c.bg, borderColor: c.badgeBorder }]}>
        <Text style={[s.testStatusText, { color: c.text }]}>{c.label}</Text>
      </View>
      <Text style={s.testDetails}>{details}</Text>
      <TouchableOpacity
        style={[s.testBtn, status === "testing" && { opacity: 0.5 }]}
        onPress={onTest}
        disabled={status === "testing"}
        activeOpacity={0.7}
      >
        <Text style={s.testBtnText}>
          {status === "testing" ? "⏳ กำลังทดสอบ..." : "▶️ ทดสอบ"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// ===== Component: SummaryBadge =====
const SummaryBadge = ({ label, status }: { label: string; status: string }) => {
  const c = statusColorMap[status as TestStatus] || statusColorMap.idle;
  return (
    <View style={[s.summaryBadgeItem, { backgroundColor: c.bg, borderColor: c.badgeBorder }]}>
      <Text style={[s.summaryBadgeText, { color: c.text }]}>{label}</Text>
    </View>
  );
};

// ===== Component หลัก =====
export default function MonitoringDashboard() {
  const [sensorOnline, setSensorOnline] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [dbConnected, setDbConnected] = useState(false);

  // Sensor Lux
  const [sensorLux, setSensorLux] = useState<number | null>(null);
  const [sensorLuxStatus, setSensorLuxStatus] = useState<TestStatus>("idle");

  // API Tests
  const [historyTestStatus, setHistoryTestStatus] = useState<TestStatus>("idle");
  const [historyCount, setHistoryCount] = useState(0);
  const [historyResponseTime, setHistoryResponseTime] = useState<number | null>(null);
  const [saveTestStatus, setSaveTestStatus] = useState<TestStatus>("idle");
  const [saveResponseTime, setSaveResponseTime] = useState<number | null>(null);
  const [deleteTestStatus, setDeleteTestStatus] = useState<TestStatus>("idle");
  const [deleteResponseTime, setDeleteResponseTime] = useState<number | null>(null);

  // Logic Tests
  const [evalTestStatus, setEvalTestStatus] = useState<TestStatus>("idle");
  const [evalTestDetails, setEvalTestDetails] = useState("");
  const [helperTestStatus, setHelperTestStatus] = useState<TestStatus>("idle");
  const [helperTestDetails, setHelperTestDetails] = useState("");

  const [allTestsRun, setAllTestsRun] = useState(false);

  // ===== ฟังก์ชันตรวจสอบ Sensor =====
  const checkSensor = () => {
    LightSensor.setUpdateInterval(2000);
    const sub = LightSensor.addListener(() => setSensorOnline(true));
    return sub;
  };

  // ===== ฟังก์ชันดึงข้อมูลจาก API =====
  const fetchMonitoring = async () => {
    try {
      const data = await getMonitoring();
      setApiConnected(true);
      setDbConnected(!!data);
    } catch {
      setApiConnected(false);
      setDbConnected(false);
    }
  };

  // ===== ทดสอบ Sensor อ่านค่า Lux =====
  const testSensorLux = () => {
    if (Platform.OS !== "android") {
      setSensorLuxStatus("fail");
      setSensorLux(null);
      return;
    }
    setSensorLuxStatus("testing");
    LightSensor.setUpdateInterval(1000);
    const sub = LightSensor.addListener((data) => {
      setSensorLux(data.illuminance);
      setSensorLuxStatus("pass");
      sub.remove();
    });
    setTimeout(() => {
      setSensorLuxStatus((prev) => (prev === "testing" ? "fail" : prev));
      sub.remove();
    }, 5000);
  };

  // ===== ทดสอบ API ดึงข้อมูลประวัติ =====
  const testFetchHistory = async () => {
    setHistoryTestStatus("testing");
    const start = Date.now();
    try {
      const data = await getHistory();
      setHistoryResponseTime(Date.now() - start);
      setHistoryCount(data.length);
      setHistoryTestStatus("pass");
    } catch {
      setHistoryResponseTime(Date.now() - start);
      setHistoryCount(0);
      setHistoryTestStatus("fail");
    }
  };

  // ===== ทดสอบ API บันทึกข้อมูล =====
  const testSaveData = () =>
    runTimedTest(
      () => addLight(999, getStatus(999)),
      setSaveTestStatus,
      setSaveResponseTime,
    );

  // ===== ทดสอบ API ลบข้อมูล =====
  const testDeleteData = async () => {
    setDeleteTestStatus("testing");
    const start = Date.now();
    try {
      const data = await getHistory();
      if (data.length === 0) {
        setDeleteResponseTime(Date.now() - start);
        setDeleteTestStatus("fail");
        return;
      }
      const result = await deleteLight(data[data.length - 1].id);
      setDeleteResponseTime(Date.now() - start);
      setDeleteTestStatus(result.success ? "pass" : "fail");
    } catch {
      setDeleteResponseTime(Date.now() - start);
      setDeleteTestStatus("fail");
    }
  };

  // ===== ทดสอบ Evaluation Logic =====
  const testEvaluationLogic = () => {
    setEvalTestStatus("testing");
    try {
      const tests = [
        { lux: 400, act: "reading",  expectedSuitable: true,  label: "อ่านหนังสือ 400 Lux" },
        { lux: 10,  act: "reading",  expectedSuitable: false, label: "อ่านหนังสือ 10 Lux" },
        { lux: 500, act: "computer", expectedSuitable: true,  label: "ทำงานหน้าคอม 500 Lux" },
        { lux: 800, act: "writing",  expectedSuitable: false, label: "เขียนหนังสือ 800 Lux" },
        { lux: 200, act: "phone",    expectedSuitable: true,  label: "เล่นโทรศัพท์ 200 Lux" },
        { lux: 30,  act: "sleep",    expectedSuitable: true,  label: "นอนพัก 30 Lux" },
      ];
      const result = runLogicTests(tests, (t) => {
        const range = getSuitableRange(t.act);
        return (t.lux >= range.min && t.lux <= range.max) === t.expectedSuitable;
      });
      setEvalTestDetails(result.details);
      setEvalTestStatus(result.passed === result.total ? "pass" : "fail");
    } catch {
      setEvalTestDetails("เกิดข้อผิดพลาดในการทดสอบ");
      setEvalTestStatus("fail");
    }
  };

  // ===== ทดสอบ getStatus helper =====
  const testHelperGetStatus = () => {
    setHelperTestStatus("testing");
    try {
      const tests = [
        { lux: 5,   expected: "มืด",       label: "5 Lux → มืด" },
        { lux: 50,  expected: "สลัว",      label: "50 Lux → สลัว" },
        { lux: 300, expected: "สว่างปกติ", label: "300 Lux → สว่างปกติ" },
        { lux: 600, expected: "สว่างมาก",  label: "600 Lux → สว่างมาก" },
      ];
      const result = runLogicTests(tests, (t) => getStatus(t.lux) === t.expected);
      setHelperTestDetails(result.details);
      setHelperTestStatus(result.passed === result.total ? "pass" : "fail");
    } catch {
      setHelperTestDetails("เกิดข้อผิดพลาดในการทดสอบ");
      setHelperTestStatus("fail");
    }
  };

  // ===== Run All Tests =====
  const runAllTests = async () => {
    setAllTestsRun(false);
    testSensorLux();
    testHelperGetStatus();
    testEvaluationLogic();
    await testFetchHistory();
    await testSaveData();
    await testDeleteData();
    setAllTestsRun(true);
  };

  useEffect(() => {
    fetchMonitoring();
    let sub: any = null;
    if (Platform.OS === "android") sub = checkSensor();
    return () => { if (sub) sub.remove(); };
  }, []);

  // ===== สถานะรวม =====
  const allOnline = sensorOnline && apiConnected && dbConnected;
  const partialOnline = sensorOnline || apiConnected || dbConnected;
  const overall = allOnline
    ? { text: "ระบบทำงานปกติ", color: "#10B981", icon: "✅", bg: "#F0FDF4" }
    : partialOnline
    ? { text: "บางระบบมีปัญหา", color: "#F59E0B", icon: "⚠️", bg: "#FFFBEB" }
    : { text: "ระบบไม่พร้อมใช้งาน", color: "#EF4444", icon: "🔴", bg: "#FEF2F2" };

  // ===== คำนวณคะแนนสรุป =====
  const allStatuses: TestStatus[] = [
    sensorOnline ? "pass" : "fail",
    apiConnected ? "pass" : "fail",
    dbConnected ? "pass" : "fail",
    sensorLuxStatus, helperTestStatus, evalTestStatus,
    historyTestStatus, saveTestStatus, deleteTestStatus,
  ];
  const passCount = allStatuses.filter((x) => x === "pass").length;
  const totalCount = allStatuses.length;
  const percentage = Math.round((passCount / totalCount) * 100);
  const scoreColor = percentage >= 90 ? "#10B981" : percentage >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Title */}
      <Text style={s.title}>⚙️ Monitoring Dashboard</Text>

      {/* Overall Status */}
      <View style={[s.overallCard, { borderColor: overall.color, backgroundColor: overall.bg }]}>
        <Text style={s.overallIcon}>{overall.icon}</Text>
        <Text style={[s.overallText, { color: overall.color }]}>{overall.text}</Text>
        <Text style={s.overallSub}>
          {allOnline ? "ระบบทั้งหมดพร้อมใช้งาน" : "กรุณาตรวจสอบระบบที่มีปัญหา"}
        </Text>
      </View>

      {/* Status Cards */}
      <StatusCard title="Light Sensor" icon="📡" online={sensorOnline} />
      <StatusCard title="API Server" icon="🌐" online={apiConnected} />
      <StatusCard title="Database" icon="🗄️" online={dbConnected} />

      {/* Refresh */}
      <TouchableOpacity style={s.refreshBtn} onPress={fetchMonitoring} activeOpacity={0.7}>
        <Text style={s.refreshBtnText}>🔄 ตรวจสอบอีกครั้ง</Text>
      </TouchableOpacity>

      {/* Divider */}
      <View style={s.divider} />
      <Text style={s.sectionTitle}>🧪 ทดสอบระบบเพิ่มเติม</Text>

      {/* Run All Tests */}
      <TouchableOpacity style={s.runAllBtn} onPress={runAllTests} activeOpacity={0.7}>
        <Text style={s.runAllBtnText}>🚀 ทดสอบทั้งหมด</Text>
      </TouchableOpacity>

      {/* Test Cards */}
      <TestResultCard
        title="📡 ทดสอบ Sensor อ่านค่า Lux"
        status={sensorLuxStatus}
        details={
          sensorLuxStatus === "idle" ? "ยังไม่ได้ทดสอบ" :
          sensorLuxStatus === "testing" ? "กำลังอ่านค่า..." :
          sensorLuxStatus === "pass" ? `ค่า Lux ที่อ่านได้: ${sensorLux?.toFixed(1)} Lux\nสถานะ: ${getStatus(sensorLux || 0)}` :
          Platform.OS !== "android" ? "ใช้ได้เฉพาะ Android" : "ไม่สามารถอ่านค่า Sensor ได้"
        }
        onTest={testSensorLux}
      />
      <TestResultCard
        title="🔧 ทดสอบ getStatus Helper"
        status={helperTestStatus}
        details={helperTestStatus === "idle" ? "ยังไม่ได้ทดสอบ" : helperTestStatus === "testing" ? "กำลังทดสอบ..." : helperTestDetails}
        onTest={testHelperGetStatus}
      />
      <TestResultCard
        title="🔬 ทดสอบ Evaluation Logic"
        status={evalTestStatus}
        details={evalTestStatus === "idle" ? "ยังไม่ได้ทดสอบ" : evalTestStatus === "testing" ? "กำลังทดสอบ..." : evalTestDetails}
        onTest={testEvaluationLogic}
      />
      <TestResultCard
        title="📋 ทดสอบ API ดึงข้อมูลประวัติ"
        status={historyTestStatus}
        details={
          historyTestStatus === "idle" ? "ยังไม่ได้ทดสอบ" :
          historyTestStatus === "testing" ? "กำลังเรียก API..." :
          historyTestStatus === "pass"
            ? `จำนวนข้อมูล: ${historyCount} รายการ\nResponse Time: ${historyResponseTime} ms`
            : `เชื่อมต่อ API ไม่ได้\nResponse Time: ${historyResponseTime} ms`
        }
        onTest={testFetchHistory}
      />
      <TestResultCard
        title="💾 ทดสอบ API บันทึกข้อมูล"
        status={saveTestStatus}
        details={
          saveTestStatus === "idle" ? "ยังไม่ได้ทดสอบ" :
          saveTestStatus === "testing" ? "กำลังบันทึก (999 Lux)..." :
          saveTestStatus === "pass"
            ? `บันทึกสำเร็จ (ทดสอบค่า 999 Lux)\nResponse Time: ${saveResponseTime} ms`
            : `บันทึกไม่สำเร็จ\nResponse Time: ${saveResponseTime} ms`
        }
        onTest={testSaveData}
      />
      <TestResultCard
        title="🗑️ ทดสอบ API ลบข้อมูล"
        status={deleteTestStatus}
        details={
          deleteTestStatus === "idle" ? "ยังไม่ได้ทดสอบ" :
          deleteTestStatus === "testing" ? "กำลังลบข้อมูล..." :
          deleteTestStatus === "pass"
            ? `ลบข้อมูลสำเร็จ\nResponse Time: ${deleteResponseTime} ms`
            : `ลบข้อมูลไม่สำเร็จ\nResponse Time: ${deleteResponseTime} ms`
        }
        onTest={testDeleteData}
      />

      {/* สรุปผลการทดสอบ */}
      {allTestsRun && (
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>📊 สรุปผลการทดสอบ</Text>

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Monitoring</Text>
            <View style={s.summaryResults}>
              <SummaryBadge label="Sensor" status={sensorOnline ? "pass" : "fail"} />
              <SummaryBadge label="API" status={apiConnected ? "pass" : "fail"} />
              <SummaryBadge label="DB" status={dbConnected ? "pass" : "fail"} />
            </View>
          </View>
          <View style={s.summaryDivider} />

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Sensor Lux</Text>
            <SummaryBadge label={sensorLuxStatus === "pass" ? `${sensorLux?.toFixed(0)} Lux` : "—"} status={sensorLuxStatus} />
          </View>
          <View style={s.summaryDivider} />

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Logic Tests</Text>
            <View style={s.summaryResults}>
              <SummaryBadge label="Helper" status={helperTestStatus} />
              <SummaryBadge label="Eval" status={evalTestStatus} />
            </View>
          </View>
          <View style={s.summaryDivider} />

          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>API CRUD</Text>
            <View style={s.summaryResults}>
              <SummaryBadge label="GET" status={historyTestStatus} />
              <SummaryBadge label="POST" status={saveTestStatus} />
              <SummaryBadge label="DELETE" status={deleteTestStatus} />
            </View>
          </View>
          <View style={s.summaryDivider} />

          <View style={s.scoreSection}>
            <Text style={s.scoreLabelText}>ผ่าน {passCount}/{totalCount} รายการ</Text>
            <View style={s.progressBarTest}>
              <View style={[s.progressFillTest, { width: `${percentage}%`, backgroundColor: scoreColor }]} />
            </View>
            <Text style={[s.scorePercentage, { color: scoreColor }]}>{percentage}%</Text>
          </View>
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
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
    backgroundColor: "#FFF",
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

  // Buttons
  refreshBtn: {
    backgroundColor: "#FFF",
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
  runAllBtn: {
    backgroundColor: "#0D9488",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  runAllBtnText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#FFF",
  },

  // Section
  divider: {
    height: 2,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
    borderRadius: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#1F2937",
  },

  // Test Result Card
  testCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  testCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  testCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
    flex: 1,
  },
  testStatusBadge: {
    alignSelf: "flex-start",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    marginBottom: 10,
  },
  testStatusText: {
    fontSize: 13,
    fontWeight: "600",
  },
  testDetails: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
    marginBottom: 12,
  },
  testBtn: {
    backgroundColor: "#F0FDFA",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#99F6E4",
  },
  testBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0D9488",
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 22,
    marginTop: 16,
    borderWidth: 2,
    borderColor: "#0D9488",
    elevation: 3,
    shadowColor: "#0D9488",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  summaryResults: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 4,
  },
  summaryBadgeItem: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    marginLeft: 6,
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Score
  scoreSection: {
    alignItems: "center",
    marginTop: 12,
  },
  scoreLabelText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  progressBarTest: {
    width: "100%",
    height: 10,
    backgroundColor: "#E5E7EB",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFillTest: {
    height: "100%",
    borderRadius: 5,
  },
  scorePercentage: {
    fontSize: 28,
    fontWeight: "bold",
  },
});
