import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './components/HomeScreen';
import LoginScreen from "./components/LoginScreen"; 
import RegisterScreen from "./components/RegisterScreen";
import LinkPhoneScreen from "./components/LinkEmailAndPhone";  
import ShowClassScreen from "./components/ShowClassScreen";
import OTPScreen from "./components/OTPScreen";
import ClassDetail from "./components/ClassDetail";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="OTPLogin" component={OTPScreen}/>
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="LinkEmailAndPhone" component={LinkPhoneScreen}/>
        <Stack.Screen name="ShowClass" component={ShowClassScreen} />
        <Stack.Screen name="ClassDetail" component={ClassDetail}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}