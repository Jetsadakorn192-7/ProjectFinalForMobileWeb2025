import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "./firebaseConfig";
import { Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const ClassDetail = ({ navigation, route }) => {
  const { cid } = route.params || {};
  const [cno, setCno] = useState(null);
  const [qid, setQid] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [remark, setRemark] = useState("");
  const [questionShow, setQuestionShow] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(true);
  const [courseCode, setCourseCode] = useState("");

  const uid = auth.currentUser?.uid;

  // When component mounts or cid changes
  useEffect(() => {
    if (cid) {
      fetchClassData(cid);
      fetchLastCheckin(cid);
      fetchQuestionId(cid);
    } else {
      loadStoredData();
    }
  }, [cid]);

  // Function to fetch the latest question ID
  const fetchQuestionId = async (classId) => {
    try {
      const questionCollectionRef = collection(db, `classroom/${classId}/question`);
      const qQuestion = query(questionCollectionRef, orderBy("question_no", "desc"), limit(1));
      const querySnapshot = await getDocs(qQuestion);
      if (!querySnapshot.empty) {
        const latestQuestionDoc = querySnapshot.docs[0];
        setQid(latestQuestionDoc.id);
      } else {
        setQid(null);
      }
    } catch (error) {
      console.error("❌ Error fetching question ID:", error);
    }
  };

  // Subscribe to listen for question_show and question_text changes
  useEffect(() => {
    if (cid && qid) {
      const questionRef = doc(db, `classroom/${cid}/question/${qid}`);
      const unsubscribe = onSnapshot(questionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setQuestionShow(data.question_show || false);
          setQuestionText(data.question_text || "");
        }
      });
      return () => unsubscribe();
    }
  }, [qid]);

  // Function to fetch course data
  const fetchClassData = async (classId) => {
    try {
      const classRef = doc(db, "classroom", classId);
      const classSnap = await getDoc(classRef);
      if (classSnap.exists()) {
        setCourseName(classSnap.data().info?.name || "Course name not specified");
        setCourseCode(classSnap.data().info?.code || "Course code not specified")
      } else {
        Alert.alert("⚠️ Course not found");
      }
    } catch (error) {
      Alert.alert("❌ Error", error.message);
    }
    setLoading(false);
  };

  // Function to fetch the latest check-in
  const fetchLastCheckin = async (classId) => {
    try {
      const checkinRef = collection(db, `classroom/${classId}/checkin`);
      const qCheckin = query(checkinRef, orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(qCheckin);
      if (!querySnapshot.empty) {
        const lastCheckin = querySnapshot.docs[0].id;
        setCno(lastCheckin);
        storeData(classId, lastCheckin);
      }
    } catch (error) {
      console.error("Error fetching check-in:", error);
    }
  };

  // Store class data in AsyncStorage
  const storeData = async (classId, checkinNo) => {
    try {
      await AsyncStorage.setItem("classInfo", JSON.stringify({ classId, checkinNo }));
    } catch (error) {
      console.error("Error storing class info:", error);
    }
  };

  // Load data from AsyncStorage if no cid
  const loadStoredData = async () => {
    try {
      const value = await AsyncStorage.getItem("classInfo");
      if (value) {
        const { classId, checkinNo } = JSON.parse(value);
        setCno(checkinNo);
        fetchClassData(classId);
      }
    } catch (error) {
      console.error("Error loading stored data:", error);
    }
  };

  // Function to save remarks
  const handleSaveRemark = async () => {
    if (!remark) return Alert.alert("Please enter a remark");
    try {
      const remarkRef = doc(db, `classroom/${cid}/checkin/${cno}/students/${uid}`);
      await setDoc(remarkRef, { remark }, { merge: true });
      Alert.alert("✅ ถามคำถามสำเร็จ!");
      setRemark(""); // Clear the remark field after saving
    } catch (error) {
      Alert.alert("❌ Failed to save", error.message);
    }
  };

  // Function to submit answer
  const handleSubmitAnswer = async () => {
    if (!answer) return Alert.alert("Please enter your answer");
    try {
      const answerRef = doc(db, `classroom/${cid}/question/${qid}/answers/${uid}`);
      await setDoc(answerRef, { text: answer, timestamp: new Date() }, { merge: true });
      Alert.alert("✅ Answer submitted successfully!");
      setAnswer(""); // Clear the answer field after submission
    } catch (error) {
      Alert.alert("❌ Failed to submit answer", error.message);
    }
  };

  if (loading) {
    return (
      <ImageBackground
        source={{ uri: "https://i.pinimg.com/736x/bf/45/70/bf4570bc0b2db1a6115ae7b1372fb935.jpg" }}
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading class information...</Text>
        </View>
      </ImageBackground>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: "https://i.pinimg.com/736x/fd/bf/e0/fdbfe0d1607ee0757f6fbf8a06284796.jpg" }}
        style={styles.background}
        resizeMode="cover"
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <View style={styles.headerContainer}>
              <Text style={styles.title} >Class Session</Text>
            </View>

            <View style={styles.courseInfoCard}>
              <View style={styles.courseInfoRow}>
                <Ionicons name="book-outline" size={24} color="#053C5E" />
                <Text style={styles.courseLabel}>Course Code:</Text>
                <Text style={styles.courseInfo}>{courseCode}</Text>
              </View>
              <View style={styles.courseInfoRow}>
                <Ionicons name="school-outline" size={24} color="#053C5E" />
                <Text style={styles.courseLabel}>Course Name:</Text>
                <Text style={styles.courseInfo}>{courseName}</Text>
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Ionicons name="create-outline" size={24} color="#053C5E" />
                <Text style={styles.cardTitle}>เพิ่มคำถาม</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="เพิ่มคำถามตรงนี้"
                value={remark}
                onChangeText={setRemark}
                multiline
              />
              <TouchableOpacity 
                style={[styles.button, !remark ? styles.buttonDisabled : null]} 
                onPress={handleSaveRemark}
                disabled={!remark}
              >
                <Text style={styles.buttonText}>บันทึก คำถาม</Text>
              </TouchableOpacity>
            </View>

            {questionShow && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="help-circle-outline" size={24} color="#053C5E" />
                  <Text style={styles.cardTitle}>Question</Text>
                </View>
                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>{questionText}</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Type your answer here"
                  value={answer}
                  onChangeText={setAnswer}
                  multiline
                />
                <TouchableOpacity 
                  style={[styles.button, !answer ? styles.buttonDisabled : null]} 
                  onPress={handleSubmitAnswer}
                  disabled={!answer}
                >
                  <Text style={styles.buttonText}>Submit Answer</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity 
              style={styles.exitButton} 
              onPress={() => navigation.navigate("Home")}
            >
              <Ionicons name="home-outline" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#333",
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#053C5E",
  },
  icon: {
    width: 40,
    height: 40,
    marginLeft: 10,
  },
  courseInfoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  courseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  courseLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: "#053C5E",
    marginLeft: 10,
  },
  courseInfo: {
    fontSize: 16,
    fontWeight: '400',
    color: "#333",
    marginLeft: 5,
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 15,
    marginVertical: 10,
    width: '100%',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: "#053C5E",
    marginLeft: 10,
  },
  questionContainer: {
    backgroundColor: "#f0f7ff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  questionText: {
    fontSize: 16,
    color: "#053C5E",
    lineHeight: 24,
  },
  input: {
    backgroundColor: "#f9f9f9",
    width: "100%",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
    minHeight: 100,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: "#b3d1ff",
  },
  exitButton: {
    backgroundColor: "#dc3545",
    padding: 15,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 10,
  },
});

export default ClassDetail;