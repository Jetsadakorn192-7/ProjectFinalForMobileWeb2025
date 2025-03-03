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
  Image,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { auth } from "./firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  const validatePassword = (password) => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in UID:", userCredential.user.uid);
      
      // Show success animation instead of alert
      navigation.replace("LinkEmailAndPhone");
    } catch (error) {
      let errorMessage = "Login failed. Please check your credentials and try again.";
      
      if (error.code === "auth/user-not-found") {
        errorMessage = "User not found. Please check your email or register.";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Invalid password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email format.";
      }
      
      Alert.alert("Login Failed", errorMessage);
    }
    setLoading(false);
  };

  const handleOTPLogin = () => {
    navigation.navigate("OTPLogin");
  };

  const handleRegister = () => {
    navigation.navigate("Register");
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#6c63ff" />
        
        <LinearGradient
          colors={["#6c63ff", "#5a52cc"]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            {/* <Image
              source={require("./assets/login-icon.jpg")} // Make sure to add this imag
              style={styles.logo}
              resizeMode="contain"
            /> */}
            <Text style={styles.appName}>EduConnect</Text>
            <Text style={styles.tagline}>Learn, Connect, Succeed</Text>
          </View>
        </LinearGradient>
        
        <Animated.View 
          style={[
            styles.formContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
          
          {/* Email Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
              <MaterialIcons name="email" size={22} color="#6c63ff" />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                keyboardType="email-address"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) validateEmail(text);
                }}
                autoCapitalize="none"
                placeholderTextColor="#aaa"
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.inputContainer, passwordError ? styles.inputError : null]}>
              <MaterialIcons name="lock" size={22} color="#6c63ff" />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) validatePassword(text);
                }}
                placeholderTextColor="#aaa"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Feather 
                  name={showPassword ? "eye" : "eye-off"} 
                  size={20} 
                  color="#6c63ff" 
                />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.orDivider}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Login with OTP Button */}
          <TouchableOpacity style={styles.otpButton} onPress={handleOTPLogin}>
            <MaterialIcons name="phone-android" size={20} color="#fff" />
            <Text style={styles.buttonText}> Sign In with OTP</Text>
          </TouchableOpacity>

          {/* Register Section */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerPrompt}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerGradient: {
    height: '30%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius:.30,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  formContainer: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: -40,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    elevation: 10,
    shadowColor: "#333",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginTop: 10,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: "#777",
    marginBottom: 28,
  },
  inputWrapper: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
    fontWeight: '600',
    paddingLeft: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: {
    padding: 4,
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#6c63ff",
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
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
    backgroundColor: "#a5a1e3",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  orDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  orText: {
    color: "#888",
    paddingHorizontal: 10,
    fontSize: 14,
  },
  otpButton: {
    backgroundColor: "#28a745",
    flexDirection: "row",
    paddingVertical: 14,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    shadowColor: "#28a745",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 30,
  },
  registerPrompt: {
    color: "#555",
    fontSize: 15,
  },
  registerText: {
    color: "#6c63ff",
    fontSize: 15,
    fontWeight: "700",
  }
});

export default LoginScreen;