import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";
import { useScanHistory } from "@/hooks/useScanHistory";
import { analyzePrescription } from "@/lib/api";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CameraScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [permission, requestPermission] = useCameraPermissions();
  const [flashMode, setFlashMode] = useState<"off" | "on">("off");
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { addScan } = useScanHistory();

  const handleCapture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.8,
      });

      if (photo?.base64) {
        await processImage(photo.uri, photo.base64);
      }
    } catch (error) {
      console.error("Error capturing photo:", error);
      Alert.alert("Error", "Failed to capture photo. Please try again.");
      setIsProcessing(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]?.base64) {
        setIsProcessing(true);
        await processImage(result.assets[0].uri, result.assets[0].base64);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const processImage = async (imageUri: string, base64: string) => {
    try {
      const result = await analyzePrescription(base64);
      const scanId = await addScan({
        imageUri,
        medicines: result.medicines,
        medicinesCount: result.medicines.length,
        recommendations: result.recommendations,
      });

      setIsProcessing(false);
      navigation.replace("AnalysisResults", { scanId });
    } catch (error) {
      console.error("Error processing image:", error);
      Alert.alert(
        "Analysis Failed",
        "Could not analyze the prescription. Please ensure the image is clear and try again."
      );
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={[
          styles.container,
          styles.permissionContainer,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.closeButton, { top: insets.top + Spacing.lg }]}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.permissionContent}>
          <Feather name="camera-off" size={64} color={theme.textSecondary} />
          <ThemedText type="h4" style={styles.permissionTitle}>
            Camera Access Required
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.permissionText, { color: theme.textSecondary }]}
          >
            MedScan Egypt needs camera access to scan prescriptions
          </ThemedText>
          <Button onPress={requestPermission} style={styles.permissionButton}>
            Enable Camera
          </Button>
          <Pressable onPress={handlePickImage} style={styles.galleryLink}>
            <ThemedText type="link">Or select from gallery</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.container,
          styles.permissionContainer,
          { backgroundColor: theme.backgroundRoot, paddingTop: insets.top },
        ]}
      >
        <Pressable
          onPress={() => navigation.goBack()}
          style={[styles.closeButton, { top: insets.top + Spacing.lg }]}
        >
          <Feather name="x" size={24} color={theme.text} />
        </Pressable>

        <View style={styles.permissionContent}>
          <Feather name="smartphone" size={64} color={theme.textSecondary} />
          <ThemedText type="h4" style={styles.permissionTitle}>
            Use Expo Go
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.permissionText, { color: theme.textSecondary }]}
          >
            Camera is not available on web. Run this app in Expo Go on your phone to use the camera.
          </ThemedText>
          <Button onPress={handlePickImage} style={styles.permissionButton}>
            Select from Gallery
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flashMode}
      />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.lg }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <Feather name="x" size={24} color="#FFFFFF" />
        </Pressable>
        <Pressable
          onPress={() => setFlashMode(flashMode === "off" ? "on" : "off")}
          style={styles.headerButton}
        >
          <Feather
            name={flashMode === "off" ? "zap-off" : "zap"}
            size={24}
            color="#FFFFFF"
          />
        </Pressable>
      </View>

      <View style={styles.frameGuide}>
        <View style={styles.frameCorner} />
        <View style={[styles.frameCorner, styles.frameCornerTopRight]} />
        <View style={[styles.frameCorner, styles.frameCornerBottomLeft]} />
        <View style={[styles.frameCorner, styles.frameCornerBottomRight]} />
      </View>

      <View
        style={[styles.controls, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <ThemedText type="small" style={styles.guideText}>
          Align prescription within frame
        </ThemedText>

        <View style={styles.controlsRow}>
          <Pressable onPress={handlePickImage} style={styles.sideButton}>
            <Feather name="image" size={28} color="#FFFFFF" />
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={isProcessing}
            style={({ pressed }) => [
              styles.captureButton,
              { transform: [{ scale: pressed ? 0.95 : 1 }] },
            ]}
          >
            {isProcessing ? (
              <ActivityIndicator size="large" color="#FFFFFF" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </Pressable>

          <View style={styles.sideButton} />
        </View>
      </View>

      {isProcessing ? (
        <View style={styles.processingOverlay}>
          <View style={styles.aiProcessingContainer}>
            <View style={styles.aiIconContainer}>
              <Feather name="cpu" size={48} color="#FFFFFF" />
              <View style={styles.pulseCircle} />
            </View>
            <ThemedText type="h4" style={styles.processingTitle}>
              AI Analyzing...
            </ThemedText>
            <ThemedText type="body" style={styles.processingText}>
              Extracting medicines from prescription
            </ThemedText>
            <View style={styles.processingSteps}>
              <View style={styles.processingStep}>
                <Feather name="check-circle" size={16} color="#10B981" />
                <ThemedText type="small" style={styles.stepText}>Image captured</ThemedText>
              </View>
              <View style={styles.processingStep}>
                <ActivityIndicator size="small" color="#FFFFFF" />
                <ThemedText type="small" style={styles.stepText}>Reading prescription...</ThemedText>
              </View>
              <View style={styles.processingStep}>
                <Feather name="circle" size={16} color="rgba(255,255,255,0.3)" />
                <ThemedText type="small" style={[styles.stepText, { opacity: 0.5 }]}>Matching medicines</ThemedText>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  permissionContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  permissionContent: {
    alignItems: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.lg,
  },
  permissionTitle: {
    marginTop: Spacing.lg,
    textAlign: "center",
  },
  permissionText: {
    textAlign: "center",
  },
  permissionButton: {
    width: 200,
    marginTop: Spacing.lg,
  },
  galleryLink: {
    marginTop: Spacing.md,
  },
  closeButton: {
    position: "absolute",
    left: Spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    zIndex: 10,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  frameGuide: {
    position: "absolute",
    top: "20%",
    left: "10%",
    right: "10%",
    bottom: "30%",
  },
  frameCorner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
    borderTopWidth: 3,
    borderLeftWidth: 3,
    top: 0,
    left: 0,
  },
  frameCornerTopRight: {
    left: undefined,
    right: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  frameCornerBottomLeft: {
    top: undefined,
    bottom: 0,
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  frameCornerBottomRight: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: 0,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  controls: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: Spacing.lg,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  guideText: {
    color: "#FFFFFF",
    marginBottom: Spacing.xl,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["3xl"],
  },
  sideButton: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  aiProcessingContainer: {
    alignItems: "center",
    padding: Spacing["2xl"],
  },
  aiIconContainer: {
    position: "relative",
    marginBottom: Spacing.xl,
  },
  pulseCircle: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  processingTitle: {
    color: "#FFFFFF",
    marginBottom: Spacing.sm,
  },
  processingText: {
    color: "rgba(255,255,255,0.8)",
    marginBottom: Spacing.xl,
  },
  processingSteps: {
    gap: Spacing.md,
  },
  processingStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepText: {
    color: "#FFFFFF",
  },
});
