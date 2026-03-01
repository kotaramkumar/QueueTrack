import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, TouchableOpacity } from 'react-native';

import WelcomeScreen from '../screens/WelcomeScreen';
import RoleSelectScreen from '../screens/RoleSelectScreen';
import DashboardScreen from '../screens/receptionist/DashboardScreen';
import AddToQueueScreen from '../screens/receptionist/AddToQueueScreen';
import QueueListScreen from '../screens/receptionist/QueueListScreen';
import SettingsScreen from '../screens/receptionist/SettingsScreen';
import StatsScreen from '../screens/receptionist/StatsScreen';
import TrackingScreen from '../screens/customer/TrackingScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused, color }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>{emoji}</Text>
  );
}

function ReceptionistTabs({ route, navigation }) {
  const { mode } = route.params;
  const primaryColor = mode === 'restaurant' ? '#E85D04' : '#0077B6';

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 62,
          paddingBottom: 10,
          paddingTop: 6,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          elevation: 12,
          shadowColor: '#0F172A',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        initialParams={{ mode }}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="QueueList"
        component={QueueListScreen}
        initialParams={{ mode }}
        options={{
          tabBarLabel: 'Queue',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        initialParams={{ mode }}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        initialParams={{ mode }}
        options={{
          tabBarLabel: 'Stats',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function BackButton({ onPress, tintColor }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 4 }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={{ fontSize: 22, color: tintColor, fontWeight: '300' }}>‹</Text>
      <Text style={{ fontSize: 15, color: tintColor, fontWeight: '600', marginLeft: 2 }}>
        Back
      </Text>
    </TouchableOpacity>
  );
}

const linking = {
  prefixes: ['queuetrack://'],
  config: {
    screens: {
      CustomerTracking: {
        path: 'track',
        parse: {
          mode: (mode) => mode,
          no: (no) => no,
        },
      },
    },
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={({ navigation }) => ({
          headerTintColor: '#0F172A',
          headerTitleStyle: { fontWeight: '700', fontSize: 16, color: '#0F172A' },
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerLeft: ({ tintColor, canGoBack }) =>
            canGoBack ? (
              <BackButton onPress={() => navigation.goBack()} tintColor={tintColor} />
            ) : null,
        })}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="RoleSelect"
          component={RoleSelectScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="ReceptionistTabs"
          component={ReceptionistTabs}
          options={({ route, navigation }) => ({
            title: route.params?.mode === 'restaurant' ? '🍽  Restaurant' : '🏥  Hospital',
            headerLeft: () => (
              <BackButton
                onPress={() => navigation.navigate('Welcome')}
                tintColor="#0F172A"
              />
            ),
          })}
        />
        <Stack.Screen
          name="AddToQueue"
          component={AddToQueueScreen}
          options={({ route }) => ({
            title: route.params?.mode === 'restaurant' ? 'Add Customer' : 'Add Patient',
          })}
        />
        <Stack.Screen
          name="CustomerTracking"
          component={TrackingScreen}
          options={({ route, navigation }) => ({
            title: route.params?.mode === 'restaurant' ? '🍽  Track Queue' : '🏥  Track Queue',
            headerLeft: () => (
              <BackButton
                onPress={() => navigation.navigate('Welcome')}
                tintColor="#0F172A"
              />
            ),
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
