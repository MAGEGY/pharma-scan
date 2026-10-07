import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform, StyleSheet, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import HomeScreen from "@/screens/HomeScreen";
import HistoryScreen from "@/screens/HistoryScreen";
import LibraryScreen from "@/screens/LibraryScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import AdvancedFeatures from "@/components/AdvancedFeatures";
import { useTheme } from "@/hooks/useTheme";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { HeaderTitle } from "@/components/HeaderTitle";

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Library: undefined;
  Profile: undefined;
  Advanced: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

interface FABProps {
  onPress: () => void;
}

function FloatingActionButton({ onPress }: FABProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.primary,
          bottom: 70 + insets.bottom,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
        Shadows.lg,
      ]}
    >
      <Feather name="camera" size={24} color="#FFFFFF" />
    </Pressable>
  );
}

export default function MainTabNavigator({ navigation }: any) {
  const { theme, isDark } = useTheme();
  const screenOptions = useScreenOptions({ transparent: false });

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: theme.backgroundDefault,
            }),
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={100}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerTitle: () => <HeaderTitle />,
            tabBarIcon: ({ color, size }) => (
              <Feather name="home" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="History"
          component={HistoryScreen}
          options={{
            headerTitle: "History",
            tabBarIcon: ({ color, size }) => (
              <Feather name="clock" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            headerTitle: "Drug Library",
            tabBarIcon: ({ color, size }) => (
              <Feather name="book" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            headerTitle: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Advanced"
          component={AdvancedFeatures}
          options={{
            headerShown: true,
            headerTitle: "Advanced Features",
            tabBarIcon: ({ color, size }) => (
              <Feather name="shield" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <FloatingActionButton
        onPress={() => navigation.navigate("Camera")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: Spacing.fabSize,
    height: Spacing.fabSize,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
});
