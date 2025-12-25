import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

const pbUrl = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';

export async function POST(request: NextRequest) {
  try {
    const { oldPassword, newPassword, newPasswordConfirm, authToken } = await request.json();

    if (!oldPassword || !newPassword || !newPasswordConfirm || !authToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword !== newPasswordConfirm) {
      return NextResponse.json(
        { error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Create a new PocketBase instance for server-side operations
    const pb = new PocketBase(pbUrl);
    
    // Set the auth token from the client
    pb.authStore.save(authToken);

    // Verify the token is valid and refresh the auth model
    try {
      await pb.collection('users').authRefresh();
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get the authenticated user
    const authData = pb.authStore.record;
    if (!authData) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update the user's password with old password verification
    await pb.collection('users').update(authData.id, {
      oldPassword,
      password: newPassword,
      passwordConfirm: newPasswordConfirm,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error changing password:', error);
    
    // Check for specific PocketBase errors
    if (error.status === 400 && error.data?.data?.oldPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 500 }
    );
  }
}
