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

  const handleBarCodeScanned = async ({ data }) => {
    setScanned(true);
    setIsScanning(false);

    try {
        const user = auth.currentUser;
        if (!user) {
            Alert.alert("❌ Error", "Please log in first.");
            return;
        }

        let subjectId;
        try {
            const urlParams = new URL(data).searchParams;
            subjectId = urlParams.get("subjectId");
        } catch (error) {
            console.error("Invalid QR Code format:", error);
            Alert.alert("❌ Error", "Invalid QR Code format.");
            return;
        }

        if (!subjectId) {
            Alert.alert("❌ Error", "QR Code does not contain subject information.");
            return;
        }

        // Fetch student data
        const studentRef = doc(db, "Student", user.uid);
        const studentDoc = await getDoc(studentRef);

        if (!studentDoc.exists()) {
            Alert.alert("❌ Error", "Student not found in the system.");
            return;
        }

        const studentData = studentDoc.data();

        // Register student in the classroom
        const classStudentRef = doc(db, "classroom", subjectId, "Student", user.uid);
        await setDoc(classStudentRef, {
            studentId: studentData.studentId || "-",
            username: studentData.username || "Unnamed",
            email: studentData.email || "-",
            phoneNumber: studentData.phoneNumber || "-",
            joinedAt: new Date()
        });

        // Save subject under Student profile
        const studentSubjectRef = doc(db, "Student", user.uid, "subjectList", subjectId);
        await setDoc(studentSubjectRef, {
            code: subjectId,
            joinedAt: new Date()
        });

        setJoinedClass(subjectId);
        Alert.alert("✅ Enrollment Successful", `You have successfully enrolled in ${subjectId}`);

    } catch (error) {
        console.error("Error registering student:", error);
        Alert.alert("❌ Error", "An error occurred during enrollment.");
    }
  };

  // Start scanning function
  const startScanning = async () => {
    const { granted } = await requestPermission();
    if (granted) {
      setIsScanning(true);
      setScanned(false);
    } else {
      Alert.alert(
        "Permission Required", 
        "Camera access is needed to scan QR codes"
      );
    }
  };
  
  // Stop scanning function
  const stopScanning = () => {
    setIsScanning(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.loadingText}>Loading profile data...</Text>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="account-alert" size={80} color="#ff5252" />
        <Text style={styles.errorText}>Unable to load your profile</Text>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => fetchUserData(auth.currentUser?.uid)}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6c63ff" />
      
      <LinearGradient
        colors={['#6c63ff', '#8a84fa']}
        style={styles.header}
      >
        <View style={styles.profileSummary}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {userData.username?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.usernameText}>{userData.username}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          
          <View style={styles.infoItem}>
            <Ionicons name="person" size={22} color="#6c63ff" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>{userData.username}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="school" size={22} color="#6c63ff" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Student ID</Text>
              <Text style={styles.infoValue}>{userData.studentId}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="mail" size={22} color="#6c63ff" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Email</Text>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
          </View>
          
          <View style={styles.infoItem}>
            <Ionicons name="call" size={22} color="#6c63ff" style={styles.infoIcon} />
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{userData.phoneNumber || "Not provided"}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.actionsTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={startScanning}
          >
            <View style={[styles.actionIcon, {backgroundColor: '#4caf50'}]}>
              <Ionicons name="qr-code" size={28} color="#fff" />
            </View>
            <Text style={styles.actionText}>Scan QR Code</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate("ShowClass")}
          >
            <View style={[styles.actionIcon, {backgroundColor: '#2196f3'}]}>
              <Ionicons name="list" size={28} color="#fff" />
            </View>
            <Text style={styles.actionText}>My Classes</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleLogout}
          >
            <View style={[styles.actionIcon, {backgroundColor: '#f44336'}]}>
              <Ionicons name="log-out" size={28} color="#fff" />
            </View>
            <Text style={styles.actionText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {isScanning && permission?.granted && (
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#000" />
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
          
          {/* Scanner UI Overlay */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <Text style={styles.scannerTitle}>Scan Class QR Code</Text>
              <TouchableOpacity onPress={stopScanning} style={styles.closeButton}>
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scanFrameContainer}>
              <View style={styles.scanFrame}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
              </View>
              <Text style={styles.scanInstructions}>
                Position the QR code within the frame
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelScanButton}
              onPress={stopScanning}
            >
              <Text style={styles.cancelScanText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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