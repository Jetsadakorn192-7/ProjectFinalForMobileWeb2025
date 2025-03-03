import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  Keyboard
} from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { auth, db } from "./firebaseConfig";
import { signInWithPhoneNumber, PhoneAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const LinkPhoneScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const recaptchaVerifier = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Check if user already has a linked phone number on component mount
  useEffect(() => {
    checkIfPhoneLinked();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
  }, []);

  const checkIfPhoneLinked = async () => {
    setLoading(true);
    const user = auth.currentUser;
    
    if (!user) {
      navigation.replace("Login");
      return;
    }

    try {
      // Check if the user already has a phone number linked to their account
      if (user.phoneNumber) {
        // User already has phone number linked, skip this screen
        navigation.replace("Home");
        return;
      }

      // Also check if the user has a phone number in their Firestore record
      const userDocRef = doc(db, "Student", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists() && userDocSnap.data().phoneLinked === true) {
        // User has phone marked as linked in Firestore, skip to Home
        navigation.replace("Home");
        return;
      }
    } catch (error) {
      console.error("Error checking phone link status:", error);
    } finally {
      setLoading(false);
      setInitialCheckDone(true);
    }
  };

  const checkUserPhoneNumberMatches = async (enteredPhone) => {
    const user = auth.currentUser;
    if (!user) return false;
  
    try {
      const userDocRef = doc(db, "Student", user.uid);
      const userDocSnap = await getDoc(userDocRef);
      return userDocSnap.exists() && userDocSnap.data().phoneNumber === enteredPhone;
    } catch (error) {
      console.error("Error checking user phone number:", error);
      return false;
    }
  };

  const sendOTP = async () => {
    Keyboard.dismiss();
    
    if (!phoneNumber.trim()) {
      Alert.alert("Please enter your phone number");
      return;
    }
    
    let formattedPhone = phoneNumber;
    if (!formattedPhone.startsWith("+66")) {
      if (formattedPhone.startsWith("0")) {
        formattedPhone = "+66" + formattedPhone.substring(1);
      } else {
        Alert.alert("❌ Phone number must be in international format (+66) or start with 0");
        return;
      }
    }

    setLoading(true);
    const isMatch = await checkUserPhoneNumberMatches(formattedPhone);
    if (!isMatch) {
      Alert.alert("❌ Phone number doesn't match", "Please check the phone number you entered");
      setLoading(false);
      return;
    }

    try {
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
      setVerificationId(confirmation.verificationId);
      Alert.alert("✅ OTP sent successfully!", "Please check your SMS messages");
    } catch (error) {
      console.error("OTP Error:", error);
      Alert.alert("❌ Failed to send OTP", error.message);
    }
    setLoading(false);
  };

  const verifyAndLink = async () => {
    Keyboard.dismiss();
    
    if (!verificationId || !otpCode) {
      Alert.alert("Please enter the OTP code");
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, otpCode);
      const user = auth.currentUser;
      await linkWithCredential(user, credential);
      await auth.currentUser.reload();
      Alert.alert("✅ Phone linked successfully!", "Thank you for verifying your identity");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("❌ Failed to link phone", error.message);
    }
    setLoading(false);
  };

  const skipPhoneLink = () => {
    Alert.alert(
      "Skip Phone Verification",
      "You can link your phone number later from your profile. Verifying your phone helps protect your account.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Skip", onPress: () => navigation.replace("Home") }
      ]
    );
  };

  if (loading && !initialCheckDone) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.loadingText}>Checking your account...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#5a52cc" barStyle="light-content" />
      
      <LinearGradient
        colors={['#6c63ff', '#5a52cc']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Verify Your Identity</Text>
        <Text style={styles.headerSubtitle}>Enhance the security of your account</Text>
      </LinearGradient>
      
      <Animated.View 
        style={[styles.container, { opacity: fadeAnim }]}
        onStartShouldSetResponder={() => {
          Keyboard.dismiss();
          return false;
        }}
      >
        <FirebaseRecaptchaVerifierModal 
          ref={recaptchaVerifier}
          firebaseConfig={{
            apiKey: "AIzaSyAPOWp35o6ubJy0SE_PlAqimqa1-siXfVk",
            authDomain: "webmobileapplication-cdaaf.firebaseapp.com",
            projectId: "webmobileapplication-cdaaf",
            storageBucket: "webmobileapplication-cdaaf.appspot.com",
            messagingSenderId: "90430005457",
            appId: "1:90430005457:web:47c8bdebb51fe92435e5f0",
            measurementId: "G-J886NPRZWK"
          }}
          attemptInvisibleVerification={false}
        />
        
        <View style={styles.cardContainer}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="phone-android" size={32} color="#ffffff" />
          </View>
          
          <Text style={styles.title}>Link Your Phone Number</Text>
          <Text style={styles.subtitle}>Please verify the phone number registered in your account</Text>

          <View style={styles.inputContainer}>
            <MaterialIcons name="phone" size={24} color="#6c63ff" />
            <TextInput
              style={styles.input}
              placeholder="Phone number (e.g., 0812345678)"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholderTextColor="#aaa"
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={sendOTP} 
            disabled={loading}
          >
            {loading ? 
              <ActivityIndicator color="#fff" /> : 
              <Text style={styles.buttonText}>
                <Ionicons name="send" size={18} /> Send OTP Code
              </Text>
            }
          </TouchableOpacity>

          {verificationId && (
            <View style={styles.otpSection}>
              <Text style={styles.otpTitle}>Enter the OTP you received</Text>
              
              <View style={styles.inputContainer}>
                <MaterialIcons name="vpn-key" size={24} color="#6c63ff" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit OTP code"
                  keyboardType="number-pad"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  maxLength={6}
                  placeholderTextColor="#aaa"
                />
              </View>

              <TouchableOpacity 
                style={[styles.buttonVerify, loading && styles.buttonDisabled]} 
                onPress={verifyAndLink} 
                disabled={loading}
              >
                {loading ? 
                  <ActivityIndicator color="#fff" /> : 
                  <Text style={styles.buttonText}>
                    <Ionicons name="checkmark-circle" size={18} /> Verify OTP
                  </Text>
                }
              </TouchableOpacity>
              
              <TouchableOpacity onPress={sendOTP} disabled={loading}>
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <TouchableOpacity style={styles.skipButton} onPress={skipPhoneLink}>
          <Text style={styles.skipText}>Skip phone verification</Text>
        </TouchableOpacity>
        
        <Text style={styles.securityNote}>
          <Ionicons name="shield-checkmark-outline" size={14} /> Phone verification adds an extra layer of security to your account
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  cardContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#6c63ff",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 16,
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f6f6f6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#6c63ff",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#a9a6df",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  otpSection: {
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 24,
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#444",
    marginBottom: 16,
    textAlign: "center",
  },
  buttonVerify: {
    backgroundColor: "#28a745",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  resendText: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  skipText: {
    color: "#888",
    fontSize: 14,
  },
  securityNote: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  }
});

export default LinkPhoneScreen;