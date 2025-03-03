// OTPScreen.js
import React, { useState, useRef } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import { FirebaseRecaptchaVerifierModal } from "expo-firebase-recaptcha";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { 
  auth,
  firebaseConfig,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  db,
  collection,
  query,
  where,
  getDocs
} from "./firebaseConfig";

const OTPScreen = ({ navigation }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Create ref for RecaptchaVerifier
  const recaptchaVerifier = useRef(null);

  // Function to check phone number in Firestore
  const checkPhoneNumberExists = async (phone) => {
    try {
      const usersRef = collection(db, "Student");
      const q = query(usersRef, where("phoneNumber", "==", phone));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking phone:", error);
      return false;
    }
  };

  const formatPhoneNumber = (phone) => {
    if (!phone.startsWith("+")) {
      Alert.alert("⚠️ Invalid phone format", "Please use +66XXXXXXXXX format");
      return null;
    }
    return phone;
  };

  // Function to send OTP using recaptchaVerifier
  const sendOTP = async () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (!formattedPhone) return;

    setLoading(true);

    try {
      // Check if phone exists in Firestore
      const phoneExists = await checkPhoneNumberExists(formattedPhone);
      if (!phoneExists) {
        Alert.alert("Account not found", "This phone number is not registered. Please sign up first.");
        setLoading(false);
        return;
      }

      // Send OTP with recaptchaVerifier.current as third parameter
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier.current);
      setVerificationId(confirmation.verificationId);
      setOtpSent(true);
      Alert.alert("OTP Sent", "Please check the SMS message on your phone");
    } catch (error) {
      console.error("OTP Error:", error);
      Alert.alert("Failed to send OTP", error.message);
    }
    setLoading(false);
  };

  const verifyOTP = async () => {
    if (!verificationCode) {
      Alert.alert("Please enter OTP code");
      return;
    }

    setLoading(true);
    try {
      const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
      await signInWithCredential(auth, credential);
      Alert.alert("Login Successful", "You've been logged in with OTP");
      navigation.replace("Home");
    } catch (error) {
      console.error("Verify OTP Error:", error);
      Alert.alert("Invalid OTP", "The verification code you entered is incorrect");
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.logoContainer}>
            {/* <Image 
              source={require('./assets/logo.png')} // Replace with your actual logo
              style={styles.logo}
              resizeMode="contain"
            /> */}
          </View>
          
          <Text style={styles.title}>Phone Authentication</Text>
          <Text style={styles.subtitle}>
            {!otpSent 
              ? "Enter your phone number to receive a verification code" 
              : "Enter the verification code sent to your phone"}
          </Text>

          {/* Add Recaptcha Modal */}
          <FirebaseRecaptchaVerifierModal
            ref={recaptchaVerifier}
            firebaseConfig={firebaseConfig}
            attemptInvisibleVerification={true}
          />

          {!otpSent ? (
            <View style={styles.card}>
              <View style={styles.inputContainer}>
                <MaterialIcons name="phone" size={24} color="#5c6bc0" />
                <TextInput
                  style={styles.input}
                  placeholder="Phone Number (+66...)"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>

              <TouchableOpacity 
                style={styles.button} 
                onPress={sendOTP} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Send OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.phoneDisplay}>OTP sent to: {phoneNumber}</Text>
              
              <View style={styles.otpInputContainer}>
                {/* OTP input field */}
                <TextInput
                  style={styles.otpInput}
                  placeholder="Enter OTP"
                  keyboardType="number-pad"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  maxLength={6}
                />
              </View>

              <TouchableOpacity 
                style={styles.verifyButton} 
                onPress={verifyOTP} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify & Login</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resendButton} 
                onPress={sendOTP} 
                disabled={loading}
              >
                <Text style={styles.resendText}>Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.linkText}>Login with Email & Password</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    paddingLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#5c6bc0",
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 10,
  },
  phoneDisplay: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  otpInputContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: "#f5f5f5",
    width: "100%",
    textAlign: "center",
    paddingVertical: 15,
    fontSize: 20,
    letterSpacing: 5,
    borderRadius: 10,
  },
  verifyButton: {
    backgroundColor: "#4caf50",
    borderRadius: 10,
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  resendButton: {
    paddingVertical: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  resendText: {
    color: "#5c6bc0",
    fontSize: 16,
  },
  linkButton: {
    alignItems: "center",
    marginTop: 20,
  },
  linkText: {
    color: "#5c6bc0",
    fontSize: 16,
  },
});

export default OTPScreen;