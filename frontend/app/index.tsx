import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import "../global.css";

export default function Index() {
  const router = useRouter();

  const handleLoginPress = () => {
    router.push("/auth/login");
  };

  const handleOnboardingPress = () => {
    router.push("/onboarding/1");
  };

  const handleRoleSelect = () => {
    router.push("/role/select")
  }

  const handleGamesPage = () => {
    router.push("/patient/activity-selector")
  }


  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-4xl font-bold p-3">
        This page should replace with the correct user dashboard based on their login
      </Text>
      <Button onPressIn={handleLoginPress} className="bg-white text-white">
        Login
      </Button>
      <Button onPressIn={handleOnboardingPress} className="bg-white text-white">
        Go to onboarding pages
      </Button>
      <Button onPressIn={handleRoleSelect} className="bg-white text-white">
        Go to Role Selector Page
      </Button>
      <Button onPressIn={handleGamesPage} className="bg-white text-white">
        Go to patient Portal
      </Button>
    </View>
  );
}