// screens/LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';
import AuthService from '../../../services/AuthService';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('https://auth4user-f5eb60492669.herokuapp.com/api/user/login', {
        email,
        password,
      });

      const authToken = response.data;
      console.log('token',authToken);

      // Save the token to AsyncStorage
      await AuthService.saveTokenToKeychain(authToken);
      navigation.navigate('Home');
      // Navigate to the next screen (e.g., home screen)
      // You can replace 'Home' with the name of your home screen
    
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password.');
    }
  };

  return (
    <View>
      <Text>Email:</Text>
      <TextInput
        placeholder="Enter your email"
        onChangeText={(text) => setEmail(text)}
        value={email}
      />

      <Text>Password:</Text>
      <TextInput
        placeholder="Enter your password"
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry
      />

      <Button title="Login" onPress={handleLogin} />
    </View>
  );
};

export default LoginScreen;
