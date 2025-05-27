import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, Platform, ScrollView } from 'react-native';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { auth, db } from '../config/firebase';
import { debugLog, debugError } from '../utils/debug';

export default function TestScreen() {
  const [status, setStatus] = useState<string[]>([]);
  
  const addStatus = (message: string) => {
    setStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testFirebaseConnection = async () => {
    addStatus(`Platform: ${Platform.OS}`);
    addStatus(`User Agent: ${Platform.OS === 'web' ? navigator.userAgent : 'N/A'}`);
    
    // Firebase Auth の状態を確認
    try {
      const currentUser = auth.currentUser;
      addStatus(`Auth: ${currentUser ? 'ログイン済み' : '未ログイン'}`);
    } catch (error) {
      addStatus(`Auth Error: ${error}`);
    }
    
    // Firestore の接続を確認
    try {
      addStatus('Firestore接続テスト中...');
      const testDoc = await db.collection('test').doc('test').get();
      addStatus(`Firestore: ${testDoc.exists ? '接続成功' : '接続成功（ドキュメントなし）'}`);
    } catch (error) {
      addStatus(`Firestore Error: ${error}`);
    }
    
    // Functions の接続を確認
    try {
      addStatus('Functions接続テスト中...');
      const functions = getFunctions();
      
      // エミュレータに接続（開発環境の場合）
      if (__DEV__ && Platform.OS === 'web') {
        connectFunctionsEmulator(functions, 'localhost', 5001);
        addStatus('Functions: エミュレータモード');
      }
      
      // ダミーの関数を呼び出し
      const testFunction = httpsCallable(functions, 'test');
      await testFunction();
      addStatus('Functions: 接続成功');
    } catch (error: any) {
      if (error.code === 'functions/not-found') {
        addStatus('Functions: 関数が見つかりません（正常）');
      } else {
        addStatus(`Functions Error: ${error.message || error}`);
      }
    }
  };

  const testSendVerificationCode = async () => {
    try {
      addStatus('認証コード送信テスト開始...');
      const functions = getFunctions();
      const sendVerificationCode = httpsCallable(functions, 'sendVerificationCode');
      
      const result = await sendVerificationCode({ 
        email: 'test@example.com', 
        action: 'signup' 
      });
      
      addStatus(`送信成功: ${JSON.stringify(result.data)}`);
    } catch (error: any) {
      addStatus(`送信エラー: ${error.message || error}`);
      debugError('TestScreen', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Firebase接続テスト</Text>
      
      <View style={styles.buttonContainer}>
        <Button title="Firebase接続テスト" onPress={testFirebaseConnection} />
        <Button title="認証コード送信テスト" onPress={testSendVerificationCode} />
        <Button title="ログクリア" onPress={() => setStatus([])} />
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusTitle}>ステータス:</Text>
        {status.map((msg, index) => (
          <Text key={index} style={styles.statusText}>{msg}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonContainer: {
    gap: 10,
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    minHeight: 200,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    marginBottom: 5,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },
});