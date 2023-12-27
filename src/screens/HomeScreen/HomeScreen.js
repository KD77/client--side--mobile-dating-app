import React, { useState, useEffect, useId } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import AuthService from '../../../services/AuthService';
import ChatScreen from '../ChatScreen/ChatScreen';
import JWT from 'expo-jwt';

const ProfileCard = ({ profile, onSelectUser }) => {
  const handlePress = () => {
    onSelectUser && onSelectUser(profile.user);
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <View style={styles.card}>
        <Text>{`${profile.firstName} ${profile.lastName}, ${profile.gender}`}</Text>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = ({ navigation }) => {
  const [profiles, setProfiles] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AuthService.getTokenFromKeychain();
        if (!token) {
          console.error('JWT token not found');
          return;
        }

        const user = JWT.decode(token, 'GodIsGreat');
        setCurrentUserId(user._id);

        const response = await axios.get('https://user-profile-47f089296585.herokuapp.com/api/user/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setProfiles(response.data);
      } catch (error) {
        console.error('Error fetching profiles:', error.response?.data || error.message);
      }
    };

    fetchData();
  }, []);

  const handleSelectUser = (userId) => {
    setSelectedUserId(userId);
    navigation.navigate('Chat', {
      selectedReceiverId: userId,
      currentUserId:currentUserId
    });
  };

  // Filter out the current user from the list of profiles
 // Filter out the current user from the list of profiles
const filteredProfiles = profiles.filter((profile) => profile.user !== currentUserId);
console.log(filteredProfiles);


  return (
    <View>
      <Text>Profiles:</Text>
      <FlatList
        data={filteredProfiles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ProfileCard profile={item} onSelectUser={handleSelectUser} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
});

export default HomeScreen;
