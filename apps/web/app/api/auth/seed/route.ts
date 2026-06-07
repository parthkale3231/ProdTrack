import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../lib/models/User';

export async function GET() {
  try {
    await dbConnect();

    // Clear existing users to prevent duplicates during seeding
    await (User as any).deleteMany({});

    // The 5 placeholder users
    const usersToSeed = [
      { email: 'user1@prodtrack.com', password: 'password123' },
      { email: 'user2@prodtrack.com', password: 'password123' },
      { email: 'user3@prodtrack.com', password: 'password123' },
      { email: 'user4@prodtrack.com', password: 'password123' },
      { email: 'user5@prodtrack.com', password: 'password123' },
    ];

    const seededUsers = [];

    for (const user of usersToSeed) {
      // Hash password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);

      const newUser = await (User as any).create({
        email: user.email,
        password: hashedPassword,
      });

      seededUsers.push({ email: newUser.email });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully seeded 5 users with encrypted passwords.',
      users: seededUsers
    }, { status: 201 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
