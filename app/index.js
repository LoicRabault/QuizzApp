// app/index.js
import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "./auth/useAuth";
import LoginScreen from "./auth/LoginScreen";
import AdminHomeScreen from "./admin/AdminHomeScreen";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return user ? <AdminHomeScreen /> : <LoginScreen />;
}
