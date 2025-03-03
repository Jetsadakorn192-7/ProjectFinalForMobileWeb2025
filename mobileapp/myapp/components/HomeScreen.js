import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  Dimensions,
  Image 
} from "react-native";
import { auth, db, signOut, onAuthStateChanged, doc, getDoc, updateDoc, arrayUnion } from "./firebaseConfig";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
      } else {
        navigation.replace("Login");
      }
    });
    return unsubscribe;
  }, []);

  // Function to fetch user data from Firestore
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "Student", uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        Alert.alert("User Not Found", "Your profile data could not be found");
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
    setLoading(false);
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Logout Failed", error.message);
    }
  };

   // ✅ ฟังก์ชันสแกน QR Code
   const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setIsScanning(false);

    try {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("❌ ข้อผิดพลาด", "กรุณาเข้าสู่ระบบก่อน");
            return;
        }

        // ดึงค่า subjectId จาก URL ของ QR Code
        const urlParams = new URL(data).searchParams;
        const subjectId = urlParams.get("subjectId");

        if (!subjectId) {
            Alert.alert("❌ ข้อผิดพลาด", "QR Code ไม่มีข้อมูลวิชา");
            return;
        }

        // ดึงข้อมูลของนักเรียนจาก Firestore
        const studentRef = doc(db, "Student", user.uid);
        const studentDoc = await getDoc(studentRef);

        if (!studentDoc.exists()) {
            Alert.alert("❌ ข้อผิดพลาด", "ไม่พบนักเรียนในระบบ");
            return;
        }

        const studentData = studentDoc.data();

        // เพิ่มนักเรียนเข้าสู่วิชาใน Firestore (classroom/{subjectId}/Student/{studentId})
        const classStudentRef = doc(db, "classroom", subjectId, "Student", user.uid);
        await setDoc(classStudentRef, {
            studentId: studentData.studentId || "-",
            username: studentData.username || "ไม่ระบุชื่อ",
            email: studentData.email || "-",
            phoneNumber: studentData.phoneNumber || "-",
            joinedAt: new Date()
        });

        // ✅ บันทึกว่าผู้ใช้เข้าร่วมวิชาในคอลเลกชัน `Student/{studentId}/subjectList/{subjectId}`
        const studentSubjectRef = doc(db, "Student", user.uid, "subjectList", subjectId);
        await setDoc(studentSubjectRef, {
            code: subjectId, 
            joinedAt: new Date()
        });

        // ✅ อัปเดต UI แสดงว่านักเรียนเข้าร่วมแล้ว
        setJoinedClass(subjectId);
        Alert.alert("✅ ลงทะเบียนสำเร็จ", `คุณได้เข้าร่วมวิชา ${subjectId}`);

    } catch (error) {
        console.error("Error registering student:", error);
        Alert.alert("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดขณะลงทะเบียน");
    }
  };

  // ฟังก์ชันเริ่มการสแกน
  const startScanning = async () => {
    // ตรวจสอบว่ามีสิทธิ์กล้องหรือไม่
    const { granted } = await requestPermission();
    if (granted) {
      setIsScanning(true); // เปิดกล้องเพื่อสแกน
      setScanned(false); // รีเซ็ตสถานะการสแกน
    } else {
      Alert.alert("การอนุญาตกล้องถูกปฏิเสธ", "คุณต้องอนุญาตให้ใช้กล้องเพื่อสแกน QR Code");
    }
  };
  
    // ฟังก์ชันหยุดการสแกน
  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : userData ? (
        <>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>ข้อมูลส่วนตัว</Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileAvatarContainer}>
              <Text style={styles.profileAvatar}>{userData.username?.charAt(0) || "?"}</Text>
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.username}>{userData.username}</Text>
              <Text style={styles.info}>รหัสนักศึกษา: {userData.studentId}</Text>
              <Text style={styles.info}>อีเมล: {userData.email}</Text>
              <Text style={styles.info}>เบอร์โทร: {userData.phoneNumber || "-"}</Text>
            </View>
          </View>

          {/* ✅ แสดงข้อความเมื่อนักเรียนเข้าร่วมชั้นเรียนสำเร็จ */}
          {joinedClass && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>✅ เข้าร่วมชั้นเรียน {joinedClass} สำเร็จแล้ว!</Text>
            </View>
          )}

          <View style={styles.actionContainer}>
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={isScanning ? stopScanning : startScanning}
            >
              <Ionicons name="qr-code-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>สแกน QR Code เข้าร่วมชั้นเรียน</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.joinClassButton} 
              onPress={() => navigation.navigate("JoinClassByCode")}
            >
              <Ionicons name="enter-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>เข้าร่วมชั้นเรียนด้วยรหัส</Text>
            </TouchableOpacity>
            

            <TouchableOpacity size={24} style={styles.showClassButton} onPress={() => navigation.navigate("ShowClass")} >
            <Text style={styles.buttonText}>แสดงรายวิชาที่เรียน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>ออกจากระบบ</Text>
            </TouchableOpacity>
          </View>
          
          {isScanning && permission?.granted && (
            <View style={styles.fullScreenScanner}>
              <StatusBar barStyle="light-content" backgroundColor="black" />
              <CameraView
                style={styles.fullScreenCamera}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              />
              
              {/* Scan Frame */}
              <View style={styles.scannerOverlay}>
                <View style={styles.scanFrame}></View>
                <Text style={styles.scanInstructionText}>วางโค้ด QR ให้อยู่ในกรอบเพื่อสแกน</Text>
              </View>
              
              {/* Header controls */}
              <SafeAreaView style={styles.scannerControls}>
                <View style={styles.scannerHeader}>
                  <Text style={styles.scannerTitle}>สแกน QR Code</Text>
                  <TouchableOpacity 
                    style={styles.closeButton} 
                    onPress={() => setScanning(false)}
                  >
                    <Ionicons name="close" size={28} color="#fff" />
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
              
              {/* Bottom controls */}
              <SafeAreaView style={styles.bottomControls}>
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setScanning(false)}
                >
                  <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                </TouchableOpacity>
              </SafeAreaView>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#d9534f" />
          <Text style={styles.errorText}>ไม่สามารถโหลดข้อมูลผู้ใช้ได้</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUserData(auth.currentUser?.uid)}>
            <Text style={styles.retryButtonText}>ลองใหม่อีกครั้ง</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#555",
    fontWeight: "500",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f6fa",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: "#555",
    marginTop: 12,
    marginBottom: 24,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#6c63ff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    elevation: 2,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    paddingTop: StatusBar.currentHeight + 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileSummary: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
  },
  welcomeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
  },
  usernameText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    alignItems: "center",
    width: width / 3 - 20,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    textAlign: "center",
  },
  // Scanner styles
  scannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 999,
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
    padding: 20,
  },
  scannerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: StatusBar.currentHeight || 40,
  },
  scannerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  closeButton: {
    padding: 8,
  },
  scanFrameContainer: {
    alignItems: "center",
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: "relative",
  },
  cornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#6c63ff",
    width: 30,
    height: 30,
  },
  cornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#6c63ff",
    width: 30,
    height: 30,
  },
  cornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#6c63ff",
    width: 30,
    height: 30,
  },
  cornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#6c63ff",
    width: 30,
    height: 30,
  },
  scanInstructions: {
    color: "#fff",
    marginTop: 20,
    fontSize: 16,
    textAlign: "center",
    maxWidth: 280,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  cancelScanButton: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: "center",
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelScanText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default HomeScreen;