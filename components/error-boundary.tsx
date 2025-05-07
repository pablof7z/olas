import React, { ReactNode } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  errorInfo: { componentStack: string | null } | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null, errorInfo: null };
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error, errorInfo: { componentStack: errorInfo.componentStack ?? null } });
    // Optionally log error to an error reporting service here
  }

  handleReset() {
    this.setState({ error: null, errorInfo: null });
  }

  render() {
    const { error, errorInfo } = this.state;

    if (error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            An unexpected error occurred. Please try again.
          </Text>
          {__DEV__ && (
            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorLabel}>Error:</Text>
              <Text selectable style={styles.errorText}>{error.message}</Text>
              {errorInfo?.componentStack ? (
                <>
                  <Text style={styles.errorLabel}>Stack Trace:</Text>
                  <Text selectable style={styles.stackTrace}>{errorInfo.componentStack}</Text>
                </>
              ) : null}
            </ScrollView>
          )}
          <View style={styles.buttonContainer}>
            <Button title="Try Again" onPress={this.handleReset} color="#d32f2f" />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorBox: {
    backgroundColor: '#f9ecec',
    borderColor: '#d32f2f',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    maxHeight: 200,
  },
  errorLabel: {
    fontWeight: 'bold',
    color: '#b71c1c',
    marginTop: 8,
  },
  errorText: {
    color: '#b71c1c',
    marginBottom: 8,
  },
  stackTrace: {
    color: '#616161',
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    alignItems: 'center',
  },
});