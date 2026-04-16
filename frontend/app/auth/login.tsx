import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <View className="flex-1 bg-gradient-to-b from-blue-50 to-white px-6 py-12">
      {/* MemoCare Logo */}
      <View className="items-center mb-12">
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </View>

      {/* Header */}
      <View className="mb-8 items-center">
        <Text className="text-3xl font-bold text-gray-800 mb-2">
          Welcome Back!
        </Text>
        <Text className="text-gray-600 text-base">
          Sign in to your account
        </Text>
      </View>

      {/* Username Field */}
      <View className="mb-4">
        <Text className="text-gray-700 font-semibold mb-2">Username</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          placeholder="Enter your username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
        />
      </View>

      {/* Password Field */}
      <View className="mb-6">
        <Text className="text-gray-700 font-semibold mb-2">Password</Text>
        <TextInput
          className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
          placeholder="Enter your password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {/* Login Button */}
      <TouchableOpacity className="bg-blue-600 rounded-lg py-3 mb-4">
        <Text className="text-white text-center font-bold text-lg">
          Sign In
        </Text>
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center mb-4">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-2 text-gray-600">Or</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Google Sign In */}
      <TouchableOpacity className="border border-gray-300 rounded-lg py-3 mb-6 flex-row items-center justify-center">
        <Image
          source={{ uri: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/logo_googleg.png" }}
          style={{ width: 20, height: 20, marginRight: 8 }}
        />
        <Text className="text-gray-800 font-semibold">Sign up with Google</Text>
      </TouchableOpacity>

      {/* Register Link */}
      <View className="flex-row justify-center">
        <Text className="text-gray-700">Do not have an account? </Text>
        <TouchableOpacity onPress={() => router.push("/role/select")}>
          <Text className="text-blue-600 font-bold">Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Go Back Button */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="mt-8"
      >
        <Text className="text-gray-600 text-center">← Go back</Text>
      </TouchableOpacity>
    </View>
  );
}