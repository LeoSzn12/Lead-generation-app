import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, workspaceName } = await req.json();

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create workspace and user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create workspace
      const workspace = await tx.workspace.create({
        data: {
          name: workspaceName || `${name || email}'s Workspace`,
        },
      });

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || null,
          workspaceId: workspace.id,
          role: 'admin', // First user is admin
        },
      });

      return { user, workspace };
    });

    return NextResponse.json({
      message: 'User created successfully',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}
