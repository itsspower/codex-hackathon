import React, { useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

import { supabase } from '@/lib/supabase';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
};

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hi! I’m the Relink AI Assistant. I can help you find opportunities and understand your applications. How can I help?',
      sender: 'ai',
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    const message = input.trim();

    if (!message || loading) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: message,
      sender: 'user',
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message,
          current_screen: 'chatbot',
        },
      });

      if (error) {
        throw error;
      }

      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        text: data?.reply ?? 'Sorry, I could not generate a response.',
        sender: 'ai',
      };

      setMessages((previous) => [...previous, aiMessage]);
    } catch (error) {
      console.error('Chatbot error:', error);

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-error`,
          text: 'Sorry, something went wrong while contacting the AI assistant.',
          sender: 'ai',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Relink AI</Text>
        <Text style={styles.subtitle}>Your career assistant</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.sender === 'user'
                ? styles.userBubble
                : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                item.sender === 'user'
                  ? styles.userText
                  : styles.aiText,
              ]}
            >
              {item.text}
            </Text>
          </View>
        )}
      />

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
          <Text style={styles.loadingText}>Relink AI is thinking...</Text>
        </View>
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask Relink AI..."
          placeholderTextColor="#888"
          multiline
          editable={!loading}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!input.trim() || loading) && styles.disabledButton,
          ]}
          onPress={sendMessage}
          disabled={!input.trim() || loading}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
  },

  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: '#666',
  },

  messages: {
    padding: 16,
    paddingBottom: 20,
  },

  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#123A6B',
  },

  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#eee',
  },

  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },

  userText: {
    color: '#fff',
  },

  aiText: {
    color: '#222',
  },

  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },

  loadingText: {
    color: '#666',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },

  input: {
    flex: 1,
    minHeight: 45,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
  },

  sendButton: {
    backgroundColor: '#123A6B',
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 22,
  },

  disabledButton: {
    opacity: 0.5,
  },

  sendText: {
    color: '#fff',
    fontWeight: '600',
  },
});