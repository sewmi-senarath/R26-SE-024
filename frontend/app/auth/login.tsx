import { Button } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

export default function Login() {
  const router = useRouter();

  return(
    <View>
      <Text className="text-red-500 text-lg font-bold">
        Welcome to login page!
      </Text>
      <Button onPressIn={() => router.back()}>
        Go back
      </Button>
    </View>
  )
  
}