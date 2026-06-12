import { NextRequest, NextResponse } from 'next/server';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, setDoc, doc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase config from environment
const firebaseConfig = {
 apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyD2OF0ahcRoP6OLSg4teF1_2bCS13qrJGI',
 authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'nva-nutrition.firebaseapp.com',
 projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nva-nutrition',
 storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'nva-nutrition.firebasestorage.app',
 messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '1023398804980',
 appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:1023398804980:web:1d69d3a9832e8bf730cda1',
};

// For server-side, we need firebase-admin which requires service account
// This endpoint is for reference only - use the CLI setup instead

export async function POST(req: NextRequest) {
 try {
 return NextResponse.json(
 {
 error: 'This endpoint requires firebase-admin. Please use the setup guide instead.',
 guide: 'Run: npx ts-node setup-admin.ts with service account key',
 },
 { status: 503 }
 );
 } catch (error: any) {
 return NextResponse.json(
 { error: error.message || 'Setup failed' },
 { status: 500 }
 );
 }
}
