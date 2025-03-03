import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Image,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Dimensions
} from "react-native";
import { auth, db, collection, doc, getDocs } from "./firebaseConfig";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const ShowClassScreen = ({ navigation }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchClasses = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        Alert.alert(
          "Authentication Required",
          "Please log in again to continue",
          [{ text: "OK", onPress: () => navigation.replace("Login") }]
        );
        return;
      }

      // Reference to the 'subjectList' collection under Student/{userId}
      const studentRef = doc(db, "Student", user.uid);
      const subjectListRef = collection(studentRef, "subjectList");
      const querySnapshot = await getDocs(subjectListRef);

      if (!querySnapshot.empty) {
        const subjects = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setClasses(subjects);
      } else {
        setClasses([]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load your classes. Please try again later.");
      console.error("Error fetching classes:", error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchClasses();
  };

  const handleCheckIn = (classItem) => {
    Alert.alert(
      "Check-in",
      `Do you want to check in to ${classItem.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Check In", onPress: () => {
            // Add check-in functionality here
            Alert.alert("Success", `You've checked in to ${classItem.name}!`);
          }
        }
      ]
    );
  };

  const renderClassItem = ({ item }) => {
    // Determine the class status (ongoing, upcoming, or completed)
    const statusInfo = getClassStatusInfo(item);

    return (
      <TouchableOpacity 
        style={[styles.classCard, { borderLeftColor: statusInfo.color }]}
        onPress={() => navigation.navigate("ClassDetails", { classData: item })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.codeContainer}>
            <Text style={styles.classCode}>{item.code || "N/A"}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusText}>{statusInfo.text}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.className}>{item.name || "Untitled Class"}</Text>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={16} color="#6c757d" />
            <Text style={styles.infoText}>Room: {item.room || "Not specified"}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <MaterialIcons name="access-time" size={16} color="#6c757d" />
            <Text style={styles.infoText}>
              {item.time || "Schedule not available"}
            </Text>
          </View>
          
          {item.instructor && (
            <View style={styles.infoRow}>
              <MaterialIcons name="person" size={16} color="#6c757d" />
              <Text style={styles.infoText}>
                {item.instructor}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.imageContainer}>
          {item.photo ? (
            <Image 
              source={{ uri: item.photo }} 
              style={styles.classImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="school" size={32} color="#dadce0" />
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.attendanceButton, 
            statusInfo.text === "Ongoing" 
              ? styles.activeAttendanceButton 
              : styles.disabledAttendanceButton
          ]}
          onPress={() => handleCheckIn(item)}
          disabled={statusInfo.text !== "Ongoing"}
        >
          <Ionicons 
            name={statusInfo.text === "Ongoing" ? "checkmark-circle" : "time"} 
            size={20} 
            color="#fff" 
            style={styles.buttonIcon} 
          />
          <Text style={styles.buttonText}>
            {statusInfo.text === "Ongoing" ? "Check In" : 
             statusInfo.text === "Upcoming" ? "Not Available Yet" : "Class Ended"}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Helper function to determine class status
  const getClassStatusInfo = (classItem) => {
    // This is a placeholder logic. In a real app, you would compare with actual class times
    const randomStatus = Math.floor(Math.random() * 3); // Just for demo purposes
    
    switch(randomStatus) {
      case 0:
        return { text: "Ongoing", color: "#28a745" }; // Green for ongoing
      case 1:
        return { text: "Upcoming", color: "#007bff" }; // Blue for upcoming
      case 2:
        return { text: "Completed", color: "#6c757d" }; // Gray for completed
      default:
        return { text: "Unknown", color: "#6c757d" };
    }
  };

  const EmptyClassList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="book-outline" size={80} color="#dadce0" />
      <Text style={styles.emptyTitle}>No Classes Found</Text>
      <Text style={styles.emptySubtitle}>
        You haven't enrolled in any classes yet
      </Text>
      <TouchableOpacity 
        style={styles.addClassButton}
        onPress={() => navigation.navigate("AddClass")} // Assuming you have an AddClass screen
      >
        <Text style={styles.addClassText}>Add a Class</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Classes</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="filter" size={24} color="#212529" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading your classes...</Text>
        </View>
      ) : (
        <FlatList
          data={classes}
          keyExtractor={(item) => item.id}
          renderItem={renderClassItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={EmptyClassList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007bff"]}
            />
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => navigation.navigate("Dashboard")}
      >
        <Ionicons name="home" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212529",
  },
  settingsButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#6c757d",
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80, // Extra space for FAB
  },
  classCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderLeftWidth: 6,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  codeContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  classCode: {
    fontSize: 12,
    fontWeight: "500",
    color: "#495057",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
  },
  cardBody: {
    padding: 16,
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6c757d",
  },
  imageContainer: {
    height: 140,
    width: "100%",
    backgroundColor: "#f8f9fa",
  },
  classImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
  },
  attendanceButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },
  activeAttendanceButton: {
    backgroundColor: "#28a745",
  },
  disabledAttendanceButton: {
    backgroundColor: "#6c757d",
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#343a40",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 8,
    textAlign: "center",
  },
  addClassButton: {
    backgroundColor: "#007bff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 24,
  },
  addClassText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  fabButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#007bff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default ShowClassScreen;