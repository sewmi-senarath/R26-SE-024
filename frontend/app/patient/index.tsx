
// import { Ionicons } from '@expo/vector-icons';
// import { useRouter } from 'expo-router';
// import React from 'react';
// import { ScrollView, Text, TouchableOpacity, View, Image } from 'react-native';

// export default function PatientHome() {
//   const router = useRouter();
//   const currentDate = new Date().toLocaleDateString('en-US', {
//     weekday: 'long',
//     month: 'long',
//     day: 'numeric',
//   });


//   return (
//     <ScrollView className="flex-1 bg-blue-50">
//       {/* Header with Greeting */}
//       <View className="bg-gradient-to-b from-blue-600 to-blue-400 px-6 py-8 rounded-b-3xl">
//         <View className="flex-row items-center justify-between mb-2">
//           <View>
//             <View className="flex-row items-center gap-2 mb-2">
//               <Ionicons name="sunny" size={40} color="#fbbf24" />
//               <Text className="text-5xl font-bold text-black">Welcome Back</Text>
//             </View>
//           </View>
//         </View>
//         <Text className="text-2xl text-black">{currentDate}</Text>
//       </View>

//       {/* Main Content */}
//       <View className="px-6 py-6 gap-4">
//         {/* My Daily Routine Card */}
//         <TouchableOpacity
//           // onPress={() => router.push('/patient/memory')}
//           activeOpacity={0.7}
//         >
//           <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-4">
//             <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center">
//               <Ionicons name="checkmark-done-circle" size={28} color="#3b82f6" />
//             </View>
//             <View className="flex-1">
//               <Text className="text-2xl font-bold text-gray-800">My Daily Routine</Text>
//               <Text className="text-lg text-gray-600">Your routine guide</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
//           </View>
//         </TouchableOpacity>

//         {/* Memory Vault Card */}
//         <TouchableOpacity
//           // onPress={() => router.push('/patient/memory-vault')}
//           activeOpacity={0.7}
//         >
//           <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-4">
//             <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center">
//               <Ionicons name="images" size={28} color="#3b82f6" />
//             </View>
//             <View className="flex-1">
//               <Text className="text-2xl font-bold text-gray-800">Memory Vault</Text>
//               <Text className="text-lg text-gray-600">Photos & Stories</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
//           </View>
//         </TouchableOpacity>

//         {/* Brain Games Card */}
//         <TouchableOpacity
//           onPress={() => router.push('/patient/cognitive/assessment')}
//           activeOpacity={0.7}
//         >
//           <View className="bg-white rounded-2xl p-4 shadow-sm flex-row items-center gap-4">
//             <View className="w-14 h-14 bg-blue-100 rounded-xl items-center justify-center">
//               <Ionicons name="game-controller" size={28} color="#3b82f6" />
//             </View>
//             <View className="flex-1">
//               <Text className="text-2xl font-bold text-gray-800">Brain Games</Text>
//               <Text className="text-lg text-gray-600">For your Cognitive Health</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
//           </View>
//         </TouchableOpacity>

//         {/* Call for Help Card - Emergency */}
//         <TouchableOpacity
//           // onPress={() => router.push('/patient/emergency')}
//           activeOpacity={0.7}
//           className='mt-10'
//         >
//           <View className="bg-white rounded-2xl p-4 shadow-sm border-2 border-red-200 flex-row items-center gap-4">
//             <View className="w-14 h-14 bg-red-500 rounded-xl items-center justify-center">
//               <Ionicons name="call" size={28} color="white" />
//             </View>
//             <View className="flex-1">
//               <Text className="text-2xl font-bold text-red-600">Call for Help</Text>
//             </View>
//             <Ionicons name="chevron-forward" size={24} color="#fca5a5" />
//           </View>
//         </TouchableOpacity>
//       </View>

//       {/* Bottom Spacing */}
//       <View className="h-6" />
//     </ScrollView>
//   );
// }

import { logoutUser } from '@/src/api/authApi';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function PatientHome() {
  const router = useRouter();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

const handleLogout = async () => {
  const confirmed = window.confirm('Are you sure you want to logout?');
  if (confirmed) {
    await logoutUser();
    window.location.href = '/auth/login';
  }
};
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#eff6ff' }}>

      {/* Header */}
      <View style={{
        backgroundColor: '#2563eb', paddingHorizontal: 24,
        paddingTop: 56, paddingBottom: 32,
        borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Ionicons name="sunny" size={28} color="#fbbf24" />
              <Text style={{ fontSize: 26, fontWeight: 'bold', color: 'white' }}>
                Welcome Back!
              </Text>
            </View>
            <Text style={{ color: '#bfdbfe', fontSize: 15 }}>{currentDate}</Text>
          </View>

          <TouchableOpacity
            onPress={handleLogout}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
          >
            <Text style={{ color: 'white', fontWeight: '600' }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 24, gap: 16 }}>

        {/* My Daily Routine */}
        <TouchableOpacity activeOpacity={0.7}>
          <View style={{
            backgroundColor: 'white', borderRadius: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ width: 56, height: 56, backgroundColor: '#dbeafe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="checkmark-done-circle" size={28} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>My Daily Routine</Text>
              <Text style={{ color: '#6b7280', marginTop: 2 }}>Your routine guide</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>

        {/* Memory Vault */}
        <TouchableOpacity activeOpacity={0.7}>
          <View style={{
            backgroundColor: 'white', borderRadius: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ width: 56, height: 56, backgroundColor: '#dbeafe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="images" size={28} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Memory Vault</Text>
              <Text style={{ color: '#6b7280', marginTop: 2 }}>Photos & Stories</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>

        {/* Brain Games */}
        <TouchableOpacity
          onPress={() => router.push('/patient/cognitive/assessment')}
          activeOpacity={0.7}
        >
          <View style={{
            backgroundColor: 'white', borderRadius: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ width: 56, height: 56, backgroundColor: '#dbeafe', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="game-controller" size={28} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1f2937' }}>Brain Games</Text>
              <Text style={{ color: '#6b7280', marginTop: 2 }}>For your Cognitive Health</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#cbd5e1" />
          </View>
        </TouchableOpacity>

        {/* Call for Help */}
        <TouchableOpacity activeOpacity={0.7} style={{ marginTop: 24 }}>
          <View style={{
            backgroundColor: 'white', borderRadius: 16, padding: 16,
            flexDirection: 'row', alignItems: 'center', gap: 16,
            borderWidth: 2, borderColor: '#fecaca',
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
          }}>
            <View style={{ width: 56, height: 56, backgroundColor: '#ef4444', borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="call" size={28} color="white" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#dc2626' }}>Call for Help</Text>
              <Text style={{ color: '#6b7280', marginTop: 2 }}>Emergency contact</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#fca5a5" />
          </View>
        </TouchableOpacity>

      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}