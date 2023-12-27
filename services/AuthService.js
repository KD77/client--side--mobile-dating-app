import * as SecureStore from 'expo-secure-store';

const AuthService = {
  // Save token to keychain
  saveTokenToKeychain: async (token) => {
    try {
      await SecureStore.setItemAsync('jwtToken', token);
      // console.log('Token saved successfully');
    } catch (error) {
      console.error('Error saving token:', error);
    }
  },

  // Retrieve token from keychain
  getTokenFromKeychain: async () => {
    try {
      const token = await SecureStore.getItemAsync('jwtToken');
      if (token) {
        // console.log('Token retrieved successfully:', token);
        return token; // Make sure to return the token
      } else {
        // console.log('Token not found in keychain');
        return null; // Return null if token is not found
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
      return null; // Return null in case of an error
    }
  },
};

export default AuthService;
