import React, { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  StatusBar
} from "react-native";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { auth, db, createUserWithEmailAndPassword, doc, setDoc } from "./firebaseConfig";

const RegisterScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Function to validate phone number format
  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+\d{7,15}$/; // Must start with "+" followed by 7-15 digits
    return phoneRegex.test(phone);
  };

  // Function to validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Registration function
  const handleRegister = async () => {
    if (!username || !email || !password || !phoneNumber || !studentId) {
      Alert.alert("Missing Information", "Please fill in all fields");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      Alert.alert("Invalid Phone Number", "Please enter phone number in international format (e.g. +66XXXXXXXXX)");
      return;
    }

    setLoading(true);
    try {
      // Create Firebase Authentication account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user; 
      const sid = user.uid; 

      // Save user data to Firestore
      await setDoc(doc(db, "Student", sid), {
        username,
        email,
        phoneNumber,
        studentId,
        createdAt: new Date(),
      });

      Alert.alert(
        "Registration Successful!", 
        "Your account has been created successfully",
        [{ text: "Continue", onPress: () => navigation.navigate("Login") }]
      );
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address format";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak";
      }
      
      Alert.alert("Registration Failed", errorMessage);
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.headerContainer}>
              {/* <Image 
                source={require('./assets/logo.png')} // Replace with your app logo
                style={styles.logo}
                resizeMode="contain"
              /> */}
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started with our services</Text>
            </View>

            <View style={styles.formContainer}>
              {/* Username Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="person" size={20} color="#5c6bc0" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your username"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color="#5c6bc0" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="lock" size={20} color="#5c6bc0" />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity 
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons 
                      name={showPassword ? "eye-off" : "eye"} 
                      size={22} 
                      color="#757575" 
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>Password must be at least 6 characters</Text>
              </View>

              {/* Phone Number Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="phone" size={20} color="#5c6bc0" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter phone number (+66...)"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </View>

              {/* Student ID Input */}
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Student ID</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="credit-card" size={20} color="#5c6bc0" />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your student ID"
                    value={studentId}
                    onChangeText={setStudentId}
                  />
                </View>
              </View>

              {/* Register Button */}
              <TouchableOpacity 
                style={styles.registerButton} 
                onPress={handleRegister} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </TouchableOpacity>

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
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
  keyboardAvoidView: {
    flex: 1,
  },
  content: {
    padding: 24,
    flex: 1,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#212121",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  formContainer: {
    marginBottom: 20,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#424242",
    marginBottom: 6,
    paddingLeft: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: "#212121",
  },
  eyeIcon: {
    padding: 4,
  },
  passwordHint: {
    fontSize: 12,
    color: "#757575",
    marginTop: 4,
    paddingLeft: 2,
  },
  registerButton: {
    backgroundColor: "#5c6bc0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#5c6bc0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#616161",
    fontSize: 15,
  },
  loginLink: {
    color: "#5c6bc0",
    fontWeight: "600",
    fontSize: 15,
  },
  termsContainer: {
    marginTop: 20,
    paddingHorizontal: 10,
  },
  termsText: {
    textAlign: "center",
    fontSize: 13,
    color: "#9e9e9e",
    lineHeight: 18,
  },
  termsLink: {
    color: "#5c6bc0",
    fontWeight: "500",
  },
});

export default RegisterScreen;