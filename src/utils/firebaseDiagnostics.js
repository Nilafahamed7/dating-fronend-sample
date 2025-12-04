/**
 * Firebase Configuration Diagnostics
 * Run this in browser console to check Firebase setup
 */

import { app, auth } from '../config/firebase';

export const diagnoseFirebaseConfig = () => {
  const diagnostics = {
    envVars: {},
    firebaseApp: null,
    auth: null,
    phoneAuthEnabled: null,
    errors: [],
    recommendations: [],
  };

  // Check environment variables
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;

  diagnostics.envVars = {
    apiKey: apiKey ? '✅ Set' : '❌ Missing',
    projectId: projectId ? '✅ Set' : '❌ Missing',
    authDomain: authDomain ? '✅ Set' : '❌ Missing',
    apiKeyValue: apiKey ? apiKey.substring(0, 15) + '...' : 'N/A',
    projectIdValue: projectId || 'N/A',
    expectedApiKey: 'AIzaSyDivrY3jA10HgNnfuHKXz38vIE9wcdTh5E',
    expectedProjectId: 'dating-app-ae584',
  };

  // Verify API key matches
  if (apiKey && apiKey !== 'AIzaSyDivrY3jA10HgNnfuHKXz38vIE9wcdTh5E') {
    diagnostics.errors.push('API key does not match expected value');
    diagnostics.recommendations.push('Update VITE_FIREBASE_API_KEY in .env file');
  }

  // Verify project ID matches
  if (projectId && projectId !== 'dating-app-ae584') {
    diagnostics.errors.push('Project ID does not match expected value');
    diagnostics.recommendations.push('Update VITE_FIREBASE_PROJECT_ID in .env file');
  }

  // Check Firebase app
  if (app) {
    diagnostics.firebaseApp = '✅ Initialized';
    diagnostics.appOptions = {
      projectId: app.options?.projectId,
      apiKey: app.options?.apiKey ? app.options.apiKey.substring(0, 15) + '...' : 'N/A',
    };

    // Verify app project matches env
    if (app.options?.projectId !== projectId) {
      diagnostics.errors.push('Firebase app project ID does not match environment variable');
    }
  } else {
    diagnostics.firebaseApp = '❌ Not initialized';
    diagnostics.errors.push('Firebase app is not initialized');
  }

  // Check Auth
  if (auth) {
    diagnostics.auth = '✅ Initialized';
    diagnostics.authApp = auth.app?.options?.projectId;
  } else {
    diagnostics.auth = '❌ Not initialized';
    diagnostics.errors.push('Firebase Auth is not initialized');
  }

  // Add recommendations based on common issues
  if (diagnostics.errors.length > 0) {
    diagnostics.recommendations.push(
      '1. Go to: https://console.firebase.google.com/project/dating-app-ae584/authentication/providers',
      '2. Click "Phone" → Toggle "Enable" to ON → Save',
      '3. Go to: https://console.cloud.google.com/apis/credentials?project=dating-app-ae584',
      '4. Edit API key → Remove all restrictions → Save',
      '5. Go to: https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com?project=dating-app-ae584',
      '6. Enable "Identity Toolkit API"',
      '7. Wait 5-10 minutes, then clear browser cache and retry'
    );
  }

  return diagnostics;
};

export const logFirebaseDiagnostics = () => {
  return diagnoseFirebaseConfig();
};

