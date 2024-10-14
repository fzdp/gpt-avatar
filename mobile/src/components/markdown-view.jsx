import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown from 'react-native-markdown-display';

const MarkdownView = ({ content }) => {
  return (
    <Markdown style={markdownStyles}>{content.replace(/\\n/g, '\n')}</Markdown>
  );
};

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 16,
    marginTop: 20,
  },
  paragraph: {
    marginBottom: 10,
  },
});

export default MarkdownView;
