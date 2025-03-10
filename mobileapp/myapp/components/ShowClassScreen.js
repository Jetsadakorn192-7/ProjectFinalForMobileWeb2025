import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Modal,
  TextInput,
  StatusBar,
  ImageBackground,
  Animated,
  RefreshControl,
  ScrollView,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import {
  auth,
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
} from "./firebaseConfig";

const ShowClassScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [checkinCode, setCheckinCode] = useState('');
  const [remark, setRemark] = useState('');
  const [searchText, setSearchText] = useState('');
  const [successAnimation] = useState(new Animated.Value(0));
  const [showSuccess, setShowSuccess] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Animation for success notification
  const animateSuccess = () => {
    setShowSuccess(true);
    Animated.spring(successAnimation, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.spring(successAnimation, {
          toValue: 0,
          friction: 5,
          useNativeDriver: true,
        }).start(() => setShowSuccess(false));
      }, 2000);
    });
  };

  // Fetch classes from Firestore
  const fetchClasses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert("ไม่พบข้อมูลผู้ใช้", "กรุณาเข้าสู่ระบบใหม่");
        navigation.replace("Login");
        return;
      }

      setStudentId(user.uid);
      const studentRef = doc(db, "Student", user.uid);
      const subjectListRef = collection(studentRef, "subjectList");
      const querySnapshot = await getDocs(subjectListRef);

      if (querySnapshot.empty) {
        setClasses([]);
        return;
      }

      const classIds = querySnapshot.docs.map((doc) => doc.id);
      const classesQuery = query(
        collection(db, "classroom"),
        where("__name__", "in", classIds)
      );
      const classesSnapshot = await getDocs(classesQuery);

      const classData = classesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data().info,
      }));
      setClasses(classData);
    } catch (error) {
      Alert.alert("เกิดข้อผิดพลาด", error.message);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Fetch classes on component mount and when screen is focused
  useEffect(() => {
    fetchClasses();
    const unsubscribe = navigation.addListener("focus", () => {
      fetchClasses();
    });
    return unsubscribe;
  }, [navigation]);

  const handleAttendance = (classItem) => {
    setSelectedClass(classItem);
    setModalVisible(true);
  };


// Handle check-in process
const markAttendance = async () => {
  if (!selectedClass) {
    Alert.alert("ไม่พบข้อมูลคลาส", "กรุณาเลือกคลาสเรียนก่อน");
    return;
  }
  
  if (!checkinCode) {
    Alert.alert("ข้อมูลไม่ครบถ้วน", "กรุณากรอกรหัสนักศึกษา");
    return;
  }
  
  if (!/^\d{10}$/.test(checkinCode)) {
    Alert.alert("รหัสไม่ถูกต้อง", "รหัสนักศึกษา10ตัวไม่ต้องใส่ขีด");
    return;
  }
  
  setIsCheckingIn(true);
  
  try {
    const user = auth.currentUser;
    console.log(`Logged in UID: ${user?.uid}`);
    
    if (!user) {
      Alert.alert("กรุณาเข้าสู่ระบบ", "ไม่พบข้อมูลผู้ใช้");
      setModalVisible(false);
      return;
    }
    
    const studentRef = doc(db, "Student", user.uid);
    const studentSnap = await getDoc(studentRef);
    
    if (!studentSnap.exists()) {
      Alert.alert("ไม่พบข้อมูลนักเรียน");
      setModalVisible(false);
      return;
    }
    
    const studentData = studentSnap.data();
    const sid = studentData.studentId || "N/A";
    const username = studentData.username || "ไม่มีชื่อ";
    
    console.log(`Student data: ID=${sid}, Name=${username}`);
    console.log(`Selected Class ID: ${selectedClass.id}`);
    
    // Using the correct collection path: classroom/{cid}/checkin
    const checkInRef = collection(db, "classroom", selectedClass.id, "checkin");
    
    // Query for active check-ins
    const activeCheckinsQuery = query(checkInRef, where("status", "==", 1));
    const activeCheckinsSnapshot = await getDocs(activeCheckinsQuery);
    
    console.log(`Active check-in documents count: ${activeCheckinsSnapshot.size}`);
    
    if (activeCheckinsSnapshot.empty) {
      console.log("No active check-in sessions found");
      Alert.alert(
        "ไม่มีการเช็คชื่อที่เปิดอยู่", 
        "ขณะนี้ยังไม่มีการเปิดเช็คชื่อสำหรับคลาสนี้ กรุณาติดต่ออาจารย์ผู้สอน",
        [{ text: "เข้าใจแล้ว", onPress: () => setModalVisible(false) }]
      );
      return;
    }
    
    // Debugging: Log all active check-in documents
    activeCheckinsSnapshot.docs.forEach((doc, index) => {
      console.log(`Active check-in ${index}: ID=${doc.id}, code=${doc.data().checkinCode}`);
    });
    
    let checkinMatched = false;
    
    for (const docSnap of activeCheckinsSnapshot.docs) {
      const docData = docSnap.data();
      
      console.log(`Comparing input code: ${checkinCode} with doc code: ${docData.checkinCode}`);
      
      if (docData.checkinCode === checkinCode) {
        checkinMatched = true;
        console.log(`Match found in document ID: ${docSnap.id}`);
        
        // Check if student already checked in for this session
        const studentDocRef = doc(
          db,
          "classroom",
          selectedClass.id,
          "checkin",
          docSnap.id,
          "Students",
          user.uid
        );
        
        const existingCheckin = await getDoc(studentDocRef);
        if (existingCheckin.exists()) {
          Alert.alert(
            "เช็คชื่อแล้ว", 
            "คุณได้ทำการเช็คชื่อสำหรับคาบเรียนนี้ไปแล้ว",
            [{ text: "ตกลง", onPress: () => setModalVisible(false) }]
          );
          return;
        }
        
        const now = new Date();
        const dateStr = now.toISOString().split("T")[0];
        const timeStr = now.toLocaleTimeString("en-GB", { hour12: false });
        const timestamp = now.getTime();
        
        console.log(`Saving check-in at path: classroom/${selectedClass.id}/checkin/${docSnap.id}/Students/${user.uid}`);
        
        await setDoc(
          studentDocRef,
          {
            studentId: sid,
            username: username,
            date: dateStr,
            time: timeStr,
            timestamp: timestamp,
            remark: remark || "ไม่มีหมายเหตุ",
          }
        );
        
        console.log("Check-in saved successfully");
        setModalVisible(false);
        setCheckinCode('');
        setRemark('');
        
        Alert.alert(
          "เช็คชื่อสำเร็จ", 
          "บันทึกการเข้าเรียนเรียบร้อยแล้ว",
          [{ text: "ตกลง" }]
        );
        
        animateSuccess();
        break;
      }
    }
    
    if (!checkinMatched) {
      console.log("No matching check-in code found");
      Alert.alert(
        "รหัสเช็คชื่อไม่ถูกต้อง", 
        "รหัสเช็คชื่อที่คุณป้อนไม่ตรงกับรหัสสำหรับคาบเรียนนี้ กรุณาตรวจสอบและลองใหม่อีกครั้ง"
      );
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    Alert.alert("ข้อผิดพลาด", `เกิดข้อผิดพลาดในการเช็คชื่อ: ${error.message}`);
  } finally {
    setIsCheckingIn(false);
  }
};
  // Filter classes based on search text
  const filteredClasses = classes.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.code.toLowerCase().includes(searchText.toLowerCase())
  );

  // Render class card
  const renderClassCard = ({ item }) => (
    <LinearGradient
      colors={['#ffffff', '#f5f5f7']}
      style={styles.classCard}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.classHeader}>
        <View style={styles.codeContainer}>
          <Text style={styles.classCodeText}>{item.code}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <FontAwesome5 name="book-open" size={12} color="#fff" />
        </View>
      </View>

      <Text style={styles.className}>{item.name}</Text>

      <View style={styles.classInfoRow}>
        <Ionicons name="location" size={16} color="#666" />
        <Text style={styles.roomText}>ห้อง {item.room || "ไม่ระบุ"}</Text>
      </View>

      <View style={styles.actionButtonsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.checkinButton]}
          onPress={() => handleAttendance(item)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#fff" />
          <Text style={styles.actionButtonText}>เช็คชื่อ</Text>
        </TouchableOpacity>
        <TouchableOpacity
                  style={styles.modalButtons}
                  onPress={() => {
                    if (item.id) {
                      navigation.navigate("ClassDetail", { cid: item.id });
                    } else {
                      Alert.alert("⚠️ ข้อมูลไม่ถูกต้อง");
                    }
                  }}
                >
                  <Text style={styles.confirmButtons}>ห้องเรียน</Text>
          </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{ uri: "https://lh5.googleusercontent.com/proxy/1ZkdvULZu2BElN8dcneW5rMrOEA0F9JXei2T9sZWNCqfISFVMvcX6a3-3VPuAXkOZ2wEg_pexc_CAbuH6N70CHv2jxW6sR9AzbdICBWBaTZSWm04nyqkZMwvghqqSqn2bREGcgMiHXGyjbYFGN3PLJbW664tYLYs" }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.5)']}
          style={styles.gradientOverlay}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>รายวิชาของฉัน</Text>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ค้นหารายวิชา..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f86f7" />
                <Text style={styles.loadingText}>กำลังโหลดรายวิชา...</Text>
              </View>
            ) : filteredClasses.length > 0 ? (
              <FlatList
                data={filteredClasses}
                keyExtractor={(item) => item.id}
                renderItem={renderClassCard}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={fetchClasses}
                    colors={["#4f86f7"]}
                    tintColor="#4f86f7"
                  />
                }
              />
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="class" size={60} color="rgba(255,255,255,0.5)" />
                <Text style={styles.emptyText}>
                  {searchText.length > 0
                    ? "ไม่พบรายวิชาที่ค้นหา"
                    : "ยังไม่มีรายวิชาที่เรียน"}
                </Text>
                <TouchableOpacity
                  style={styles.refreshButton}
                  onPress={fetchClasses}
                >
                  <Text style={styles.refreshButtonText}>โหลดข้อมูลใหม่</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>

      {/* Check-in Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>เช็คชื่อเข้าเรียน</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            {selectedClass && (
              <View style={styles.selectedClassInfo}>
                <Text style={styles.selectedClassName}>{selectedClass.name}</Text>
                <Text style={styles.selectedClassCode}>{selectedClass.code}</Text>
              </View>
            )}

            <ScrollView style={styles.modalScrollView}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>รหัสเช็คชื่อ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="กรอกรหัสนักศึกษา"
                  value={checkinCode}
                  onChangeText={setCheckinCode}
                  keyboardType="number-pad"
                  autoFocus={true}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>หมายเหตุ (ถ้ามี)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder=""
                  value={remark}
                  onChangeText={setRemark}
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
            
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={markAttendance}
                  disabled={isCheckingIn}
                >
                  {isCheckingIn ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmButtonText}>ยืนยันเช็คชื่อ</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Success Notification */}
      {showSuccess && (
        <Animated.View
          style={[
            styles.successNotification,
            {
              opacity: successAnimation,
              transform: [{
                translateY: successAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.successContent}>
            <Ionicons name="checkmark-circle" size={24} color="#fff" />
            <Text style={styles.successText}>เช็คชื่อสำเร็จ!</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 15,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 20,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 5,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#222",
    height: 24,
  },
  contentContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingTop: 20,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  classCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  codeContainer: {
    backgroundColor: "rgba(79, 134, 247, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  classCodeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4f86f7",
  },
  badgeContainer: {
    backgroundColor: "#4f86f7",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  classInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  roomText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#666",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 5,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  checkinButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    marginTop: 10,
  },
  refreshButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: '80%', // Limit the height of modal content
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 8,
  },
  selectedClassInfo: {
    marginBottom: 20,
  },
  selectedClassName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  selectedClassCode: {
    fontSize: 14,
    color: "#666",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f5f5f7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20, // Add bottom margin to ensure buttons are visible
  },
  modalButton: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f7",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#4f86f7",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  successNotification: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  successContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  successText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
  modalButtons: {
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    flex: 0.48,
  },
  confirmButtons: {
    color: '#fff',
    fontSize: 18,
  },
  modalScrollView: {
    maxHeight: '80%',
  },

});

export default ShowClassScreen;