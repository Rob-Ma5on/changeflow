import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, organizationName } = await request.json();

    // Validate required fields
    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create organization and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          domain: email.split('@')[1] // Use email domain as org domain
        }
      });

      // Create user as admin of the organization
      const user = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          organizationId: organization.id
        },
        include: {
          organization: true
        }
      });

      return { user, organization };
    });

    // Return user data (excluding password)
    const { password: _password, ...userWithoutPassword } = result.user;

    return NextResponse.json({
      message: 'User and organization created successfully',
      user: userWithoutPassword
    }, { status: 201 });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}