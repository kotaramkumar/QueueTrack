import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueueProvider } from './src/context/QueueContext';
import AppNavigator from './src/navigation';

export default function App() {
  return (
    <QueueProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </QueueProvider>
  );
}
