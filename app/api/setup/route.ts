import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, email, displayName, idToken } = body;

    if (!uid || !email || !displayName || !idToken) {
      return NextResponse.json(
        { error: 'Missing required fields: uid, email, displayName, idToken' },
        { status: 400 }
      );
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'techyanza-69';

    // Use Firestore REST API with user's idToken to create document
    const firestoreResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${uid}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            email: { stringValue: email },
            name: { stringValue: displayName },
            role: { stringValue: '' }, // Empty role - user sets in Firebase Console
            createdAt: { timestampValue: new Date().toISOString() },
            updatedAt: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!firestoreResponse.ok) {
      const error = await firestoreResponse.json();
      console.error('Firestore REST API error:', error);
      
      return NextResponse.json({
        success: false,
        uid,
        email,
        displayName,
        message: 'User created in Auth but Firestore document creation failed. You can set the role manually in Firebase Console.',
        error: error.error?.message,
      });
    }

    return NextResponse.json({
      success: true,
      uid,
      email,
      displayName,
      message: 'Admin account created successfully! User document created in Firestore.',
    });
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create Firestore document' },
      { status: 500 }
    );
  }
}
