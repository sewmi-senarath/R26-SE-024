import { Ionicons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Text, View } from "react-native";
import { getStoredRole } from "../../src/api/authApi";
import { Colors } from "../../src/constants/colors";

// Custom Tab Icon
interface TabIconProps {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  size: number;
  badge?: number;
}

const TabBarIcon: React.FC<TabIconProps> = ({ name, color, size, badge }) => (
  <View
    style={{
      width: size + 8,
      height: size + 8,
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <Ionicons name={name} size={size} color={color} />
    {badge && badge > 0 ? (
      <View
        style={{
          position: "absolute",
          top: -2,
          right: -2,
          backgroundColor: Colors.danger,
          borderRadius: 8,
          minWidth: 16,
          height: 16,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 3,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 9, fontWeight: "800" }}>
          {badge > 99 ? "99+" : badge}
        </Text>
      </View>
    ) : null}
  </View>
);

// Layout 
export default function CaregiverLayout() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const role = await getStoredRole();
        if (!role) {
          router.replace("/auth/login");
          return;
        }
        if (role !== "caregiver") {
          if (role === "patient") router.replace("/patient/activity-selector");
          else if (role === "family") router.replace("/family");
          return;
        }
      } catch (error) {
        router.replace("/auth/login");
      } finally {
        setIsChecking(false);
      }
    };
    checkRole();
  }, []);

  if (isChecking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#94A3B8",
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#4F8EF7",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 16,
          height: Platform.OS === "ios" ? 85 : 65,
          paddingBottom: Platform.OS === "ios" ? 25 : 10,
          paddingTop: 10,
          paddingHorizontal: 8,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
     
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? "grid" : "grid-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

     
      <Tabs.Screen
        name="patients"
        options={{
          title: "Patients",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? "people" : "people-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      
      <Tabs.Screen
        name="tasks"
        options={{
          title: "Tasks",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      
      <Tabs.Screen
        name="insights"
        options={{
          title: "Insights",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? "bar-chart" : "bar-chart-outline"}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="more"
        options={{
          title: "More",
          tabBarIcon: ({ color, size, focused }) => (
            <TabBarIcon
              name={focused ? "menu" : "menu-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />

      
      <Tabs.Screen
        name="medications"
        options={{
          href: null, 
        }}
      />

      <Tabs.Screen
        name="wellbeing"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="alerts"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="reports"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="timer"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="breathing"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="hydration"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="stretching"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="dementia-screening"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="patient-report"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="hardware-hub"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="behavior-logs"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="data-ingestion"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="object-tracker"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}