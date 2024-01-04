import React, { useEffect, useState, useCallback } from 'react';
import { SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { GiftedChat } from 'react-native-gifted-chat';
import axios from 'axios';
import AuthService from '../../../services/AuthService';
import io from 'socket.io-client';



const ChatScreen = ({ route }) => {
  const { selectedReceiverId,selectedReceiverName, currentUserId } = route.params;

  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [uniqueMessageIds, setUniqueMessageIds] = useState(new Set());
 

  useEffect(() => {
    // Initialize the socket and join the chat room
    initializeSocket();
    joinChatRoom();

    // Fetch chat history
    fetchChatHistory();

    // Clean up when the component is unmounted
    return () => {
      socket && socket.disconnect();
    };
  }, []);

  const initializeSocket = () => {
    const newSocket = io('http://localhost:5050');
  
  
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
    });
  
    newSocket.on('message', (newMessage) => {
     
    
      // Check if the message ID is already in the set
      if (!uniqueMessageIds.has(newMessage._id)) {
        // If not, add it to the set and update the state
     
        setUniqueMessageIds((prevSet) => new Set([...prevSet, newMessage._id]));
    
        // Handle the new message from the server
        setMessages((previousMessages) => GiftedChat.append(previousMessages, formatMessage(newMessage)));
      }
    });
    
    
  
    newSocket.on('join', (userId) => {
      console.log(`User ${userId} joined chat:`, newSocket.id);
    });
  
    newSocket.on('disconnect', () => {
      console.log('Socket disconnected:', newSocket.id);
    });
  
    // Emit the 'join' event after the socket is initialized
    newSocket.emit('join', currentUserId);
  
    setSocket(newSocket);
  };
  

  const joinChatRoom = () => {
    // Emit the 'join' event to let the server know the user has joined the chat
    socket && socket.emit('join', currentUserId);
  };


  const fetchChatHistory = useCallback(async () => {
    try {
      const token = await AuthService.getTokenFromKeychain();
  
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
      // Do not declare a new variable here, use the state variable
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
  
      // Sort messages by createdAt in descending order
      const sortedMessages = formattedMessages.sort((a, b) => b.createdAt - a.createdAt);
  console.log(sortedMessages);
      setMessages(sortedMessages);
      
    } catch (error) {
      console.error('Error fetching chat history:', error.response?.data || error.message);
    }
  }, [currentUserId, selectedReceiverId, uniqueMessageIds, setMessages]);
  
  const formatMessage = (message, isLastMessage) => {
    const senderId = message.sender;
  
    const formattedMessage = {
      _id: message._id,
      text: message.message,
      createdAt: message.createdAt,
      user: {
        _id: senderId ? senderId.toString() : 'unknown',
        name: selectedReceiverName,
      },
    };
  
    return formattedMessage;
  };
  

  const onSend = useCallback(
    (newMessages = []) => {
      const mess= newMessages[0].text;
 
   
      // Emit the 'message' event to the server
   socket && socket.emit('message', {
        sender: currentUserId,
        receiver: selectedReceiverId,
        message:mess,
        
      });

      // Update the state with the new messages
      setMessages((previousMessages) => GiftedChat.append(previousMessages, newMessages));
    },
    [currentUserId, selectedReceiverId, socket]
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: currentUserId,
          }}
          inverted={true}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;
