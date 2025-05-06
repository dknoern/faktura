import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { userProfileModel } from '@/lib/models/userProfile';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    // Get auth session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user ID from session
    const userId = session.user.email;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Find user profile
    const userProfile = await userProfileModel.findOne({ userId });
    
    if (!userProfile) {
      return NextResponse.json({ 
        userId,
        name: '',
        title: '',
        interests: ''
      });
    }
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get auth session
    const session = await auth();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.email;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session' },
        { status: 400 }
      );
    }
    
    await dbConnect();
    const data = await request.json();
    
    // Update profile data
    data.userId = userId;
    data.updatedAt = new Date();
    
    // Find and update user profile, create if doesn't exist
    const userProfile = await userProfileModel.findOneAndUpdate(
      { userId },
      data,
      { new: true, upsert: true }
    );
    
    return NextResponse.json(userProfile);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update user profile' },
      { status: 500 }
    );
  }
}