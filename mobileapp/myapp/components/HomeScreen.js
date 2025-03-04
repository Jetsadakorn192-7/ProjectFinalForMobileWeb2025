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
} from "react-native";
import { auth, db, signOut, onAuthStateChanged, doc, getDoc, setDoc } from "./firebaseConfig";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { ImageBackground, LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const HomeScreen = ({ navigation }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [joinedClass, setJoinedClass] = useState(null);

  // ตรวจสอบว่าผู้ใช้ล็อกอินหรือไม่
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await fetchUserData(user.uid);
        // ตัวอย่าง: หากมีฟังก์ชัน fetchRegisteredClasses / fetchClassNames
        await fetchRegisteredClasses(user.uid);
        await fetchClassNames();
      } else {
        navigation.replace("Login");
      }
    });
    return unsubscribe;
  }, []);

  // ฟังก์ชันดึงข้อมูลผู้ใช้
  const fetchUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "Student", uid));
      if (!userDoc.exists()) {
        userDoc = await getDoc(doc(db, "users", uid));
      }
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      } else {
        Alert.alert("⚠️ ข้อผิดพลาด", "ไม่พบข้อมูลผู้ใช้ในระบบ");
      }
    } catch (error) {
      Alert.alert("❌ ข้อผิดพลาด", error.message);
    }
    setLoading(false);
  };
  
  // ฟังก์ชัน Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("❌ ออกจากระบบไม่สำเร็จ", error.message);
    }
  };

  // ฟังก์ชันสแกน QR
  const startScanning = async () => {
    const { granted } = await requestPermission();
    if (granted) {
      setIsScanning(true);
      setScanned(false);
    } else {
      Alert.alert("การอนุญาตกล้องถูกปฏิเสธ", "คุณต้องอนุญาตให้ใช้กล้องเพื่อสแกน QR Code");
    }
  };

  // ฟังก์ชันสแกน QR Code
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

      // บันทึกว่าผู้ใช้เข้าร่วมวิชาในคอลเลกชัน `Student/{studentId}/subjectList/{subjectId}`
      const studentSubjectRef = doc(db, "Student", user.uid, "subjectList", subjectId);
      await setDoc(studentSubjectRef, {
        code: subjectId, 
        joinedAt: new Date()
      });

      // อัปเดต UI แสดงว่านักเรียนเข้าร่วมแล้ว
      setJoinedClass(subjectId);
      Alert.alert("✅ ลงทะเบียนสำเร็จ", `คุณได้เข้าร่วมวิชา ${subjectId}`);
    } catch (error) {
      console.error("Error registering student:", error);
      Alert.alert("❌ ข้อผิดพลาด", "เกิดข้อผิดพลาดขณะลงทะเบียน");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#051e3e" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f86f7" />
          <Text style={styles.loadingText}>กำลังโหลดข้อมูล...</Text>
        </View>
      ) : userData ? (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>My Classes</Text>
            <TouchableOpacity style={styles.logoutIcon} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userData.username?.charAt(0).toUpperCase() || "?"}</Text>
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>{userData.username}</Text>
              <Text style={styles.userDetails}>{userData.studentId || "ไม่มีรหัสนักศึกษา"}</Text>
            </View>
          </View>

          {/* Notification for joined class */}
          {joinedClass && (
            <View style={styles.notification}>
              <View style={styles.notificationIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CD964" />
              </View>
              <Text style={styles.notificationText}>เข้าร่วมวิชา {joinedClass} สำเร็จแล้ว!</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {/* Scan QR Button */}
            <TouchableOpacity 
              style={styles.mainActionButton}
              onPress={startScanning}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="qr-code" size={32} color="#fff" />
              </View>
              <Text style={styles.mainActionButtonText}>สแกน QR Code</Text>
              <Text style={styles.buttonSubtitle}>เข้าร่วมชั้นเรียนใหม่</Text>
            </TouchableOpacity>

            {/* Show Classes Button */}
            <TouchableOpacity 
              style={styles.secondaryActionButton}
              onPress={() => navigation.navigate("ShowClass")}
            >
              <View style={styles.buttonIconContainer}>
                <Ionicons name="book" size={28} color="#fff" />
              </View>
              <Text style={styles.actionButtonText}>รายวิชาของฉัน</Text>
              <Text style={styles.buttonSubtitle}>ดูรายวิชาที่ลงทะเบียน</Text>
            </TouchableOpacity>
          </View>

          {/* Scanner Overlay */}
          {isScanning && permission?.granted && (
            <View style={styles.scannerOverlay}>
              <CameraView
                style={styles.camera}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              >
                <View style={styles.scannerContent}>
                  <View style={styles.scannerHeaderContainer}>
                    <Text style={styles.scannerTitle}>สแกน QR Code เพื่อเข้าร่วมชั้นเรียน</Text>
                    <TouchableOpacity 
                      style={styles.closeButton} 
                      onPress={() => setIsScanning(false)}
                    >
                      <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  
                  <View style={styles.scanFrame}></View>
                  <Text style={styles.scanInstructions}>
                    วาง QR Code ภายในกรอบเพื่อสแกน
                  </Text>
                  
                  <TouchableOpacity 
                    style={styles.cancelScanButton}
                    onPress={() => setIsScanning(false)}
                  >
                    <Text style={styles.cancelScanText}>ยกเลิก</Text>
                  </TouchableOpacity>
                </View>
              </CameraView>
            </View>
          )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#FF3B30" />
          <Text style={styles.errorText}>ไม่สามารถโหลดข้อมูลผู้ใช้ได้</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchUserData(auth.currentUser?.uid)}
          >
            <Text style={styles.retryButtonText}>ลองใหม่</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#051e3e",
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  // Header styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  logoutIcon: {
    padding: 8,
  },
  // Profile section styles
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4f86f7",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  userInfoContainer: {
    marginLeft: 15,
  },
  userName: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  userDetails: {
    color: "#aaa",
    fontSize: 14,
    marginTop: 3,
  },
  // Notification styles
  notification: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 217, 100, 0.15)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  notificationIcon: {
    marginRight: 10,
  },
  notificationText: {
    color: "#4CD964",
    fontSize: 14,
    fontWeight: "500",
  },
  // Action buttons styles
  actionButtonsContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  mainActionButton: {
    backgroundColor: "#4f86f7",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 25,
    marginBottom: 15,
    alignItems: "flex-start",
  },
  secondaryActionButton: {
    backgroundColor: "#1d3557",
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 25,
    alignItems: "flex-start",
  },
  buttonIconContainer: {
    marginBottom: 10,
  },
  mainActionButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 5,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },
  buttonSubtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
  },
  // Scanner overlay styles
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  camera: {
    flex: 1,
  },
    // Scanner overlay styles (continued)
    scannerContent: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'space-between',
      padding: 20,
    },
    scannerHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 40,
    },
    scannerTitle: {
      color: '#fff',
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
    },
    closeButton: {
      padding: 8,
    },
    scanFrame: {
      width: 250,
      height: 250,
      borderWidth: 2,
      borderColor: '#4f86f7',
      alignSelf: 'center',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
      borderRadius: 12,
      borderStyle: 'dashed',
    },
    scanInstructions: {
      color: '#fff',
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
    },
    cancelScanButton: {
      backgroundColor: 'rgba(255, 59, 48, 0.8)',
      paddingVertical: 14,
      borderRadius: 8,
      marginBottom: 30,
      alignItems: 'center',
    },
    cancelScanText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    // Error display styles
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      color: '#fff',
      fontSize: 18,
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 20,
    },
    retryButton: {
      backgroundColor: '#4f86f7',
      paddingVertical: 12,
      paddingHorizontal: 25,
      borderRadius: 8,
    },
    retryButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });
  
  export default HomeScreen;