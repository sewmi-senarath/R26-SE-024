import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import "../global.css";

export default function Index() {
  const router = useRouter();

  const handleLoginPress = () => {
    router.push("/pages/login");
  };

  return (
    <View className="flex-1 justify-center items-center">
      <Text className="text-red-500 text-lg font-bold">
        Welcome to NativeWind!
      </Text>
      <Button onPressIn={handleLoginPress} className="bg-white text-white">
        Login
      </Button>
    </View>
  );
}