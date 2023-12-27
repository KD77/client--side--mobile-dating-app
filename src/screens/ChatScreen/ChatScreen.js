import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import axios from 'axios';
import { GiftedChat } from 'react-native-gifted-chat';
import AuthService from '../../../services/AuthService';
import io from 'socket.io-client';


const ChatScreen = ({ route }) => {
  const { selectedReceiverId, currentUserId } = route.params;
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchChatHistory();
        initializeSocket();
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [fetchChatHistory]);

  const initializeSocket = () => {
    const newSocket = io('https://two-user-chat-b4909394eef4.herokuapp.com');

    newSocket.on('message', (newMessage) => {
      // Handle the new message from the server
      setMessages((previousMessages) => GiftedChat.append(previousMessages, formatMessage(newMessage)));
    });

    setSocket(newSocket);
  };
  const fetchChatHistory = useCallback(async () => {
    try {
      const token = await AuthService.getTokenFromKeychain(); // Replace with your actual token
  
      const currentUserMessagesResponse = await axios.get(
        `https://two-user-chat-b4909394eef4.herokuapp.com/api/user/chat/history/${selectedReceiverId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const selectedReceiverMessagesResponse = await axios.get(
        `https://two-user-chat-b4909394eef4.herokuapp.com/api/user/chat/history/${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      const currentUserMessages = currentUserMessagesResponse.data;
      const selectedReceiverMessages = selectedReceiverMessagesResponse.data;
  
      // Use a set to keep track of unique message IDs
      const uniqueMessageIds = new Set();
  
      const formattedCurrentUserMessages = currentUserMessages
        .filter(message => {
          if (!uniqueMessageIds.has(message._id)) {
            uniqueMessageIds.add(message._id);
            return true;
          }
          return false;
        })
        .map(formatMessage);
  
      const formattedSelectedReceiverMessages = selectedReceiverMessages
        .filter(message => {
          if (!uniqueMessageIds.has(message._id)) {
            uniqueMessageIds.add(message._id);
            return true;
          }
          return false;
        })
        .map(formatMessage);
  
      const formattedMessages = formattedCurrentUserMessages.concat(formattedSelectedReceiverMessages);
      // console.log('Formatted Messages:', formattedMessages);
   

      // Sort messages by createdAt in descending order
      const sortedMessages = formattedMessages.sort((a, b) => b.createdAt - a.createdAt);

      setMessages(sortedMessages);

    } catch (error) {
      console.error('Error fetching chat history:', error.response?.data || error.message);
    }
  }, []);
  

  const formatMessage = (message) => {
    const senderId = message.sender;

    return {
      _id: message._id,
      text: message.message,
      createdAt: new Date(message.createdAt),
      user: {
        _id: senderId ? senderId.toString() : 'unknown',
        name: senderId ? 'Unknown Sender' : 'React Native',
      },
    };
  };

  const onSend = useCallback(async (newMessages = []) => {
    // Assuming your API endpoint for sending messages is "/api/user/chat/send"
    const apiUrl = 'https://two-user-chat-b4909394eef4.herokuapp.com/api/user/chat/send';

    try {
      const token = await AuthService.getTokenFromKeychain();

      // Extract the text of the new message
      const text = newMessages[0].text;

      // Send the new message to the server
      await axios.post(
        apiUrl,
        {
          sender: currentUserId,
          receiver: selectedReceiverId,
          message: text,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the local state with the new messages
      setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));

      // Emit a socket event to inform the server about the new message
      socket.emit('send-message', { sender: currentUserId, receiver: selectedReceiverId, message: text });
    } catch (error) {
      console.error('Error sending message:', error.response?.data || error.message);
    }
  }, [currentUserId, selectedReceiverId, socket]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <GiftedChat messages={messages} onSend={onSend} user={{ _id: currentUserId }} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
