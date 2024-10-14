import { Link } from 'expo-router';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import { toast } from '@/lib/utils';
import { useSettingsStore } from '@/store/settings_store';

const SettingsScreen = () => {
  const {
    serverUrl,
    setServerUrl,
    apiTimeout,
    setApiTimeout,
  } = useSettingsStore();
  const [tempServerUrl, setTempServerUrl] = useState(serverUrl);
  const [tempApiTimeout, setTempApiTimeout] = useState(apiTimeout.toString());

  const handleSave = () => {
    setServerUrl(tempServerUrl);
    setApiTimeout(parseInt(tempApiTimeout, 10));
    toast('Saved successfully');
  };

  return (
    <View style={styles.container}>
      <View style={styles.settingItem}>
        <Text style={styles.label}>Server url</Text>
        <TextInput
          style={styles.input}
          value={tempServerUrl}
          onChangeText={setTempServerUrl}
          placeholder="Server url"
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.label}>Request timeout(seconds)</Text>
        <TextInput
          style={styles.input}
          value={tempApiTimeout}
          onChangeText={setTempApiTimeout}
          placeholder="Request timeout"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>保存</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />

      <View style={[styles.settingItem, styles.contactInfo]}>
        <Text style={styles.contactText}>fzdp01@gmail.com</Text>
        <Link href="https://github.com/fzdp/gpt-avatar" style={styles.linkText}>
          https://github.com/fzdp/gpt-avatar
        </Link>
      </View>
    </View>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingItem: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contactInfo: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  contactText: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 5,
  },
  linkText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  spacer: {
    flex: 1,
  },
});
