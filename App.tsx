
import React, {useState, useEffect} from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {databaseService} from './src/services/DatabaseService';
import {syncService} from './src/services/SyncService';
import {mlService} from './src/services/MLService';
import {AuthenticationScreen} from './src/screens/AuthenticationScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await databaseService.initialize();
        await mlService.initialize();
        const online = await syncService.verifyOnlineStatus();
        setIsOnline(online);
        if (online) {
          await syncService.syncPendingRecords();
        }
      } catch (error) {
        console.error('App init error:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    init();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading AI models...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!isAuthenticated ? (
          <Stack.Screen
            name="Authentication"
            options={{headerShown: false}}>
            {() => (
              <AuthenticationScreen
                userId="user123"
                onSuccess={() => setIsAuthenticated(true)}
              />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: 'Dashboard',
              headerRight: () => (
                <View style={styles.onlineIndicator}>
                  <View style={[styles.dot, {backgroundColor: isOnline ? '#4CAF50' : '#F44336'}]} />
                  <Text style={styles.onlineText}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                </View>
              ),
            }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff'},
  loadingText: {marginTop: 16, fontSize: 16, color: '#666'},
  onlineIndicator: {flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 8},
  dot: {width: 8, height: 8, borderRadius: 4},
  onlineText: {fontSize: 13, color: '#666'},
});