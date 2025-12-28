import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MainTabNavigator from "@/navigation/MainTabNavigator";
import CameraScreen from "@/screens/CameraScreen";
import AnalysisResultsScreen from "@/screens/AnalysisResultsScreen";
import DrugDetailScreen from "@/screens/DrugDetailScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type RootStackParamList = {
  Main: undefined;
  Camera: undefined;
  AnalysisResults: { scanId: string };
  DrugDetail: { drugId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Main"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AnalysisResults"
        component={AnalysisResultsScreen}
        options={{
          headerTitle: "Analysis Results",
        }}
      />
      <Stack.Screen
        name="DrugDetail"
        component={DrugDetailScreen}
        options={{
          headerTitle: "Drug Details",
        }}
      />
    </Stack.Navigator>
  );
}
