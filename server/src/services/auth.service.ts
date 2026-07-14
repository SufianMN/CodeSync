import { prisma } from '../utils/prisma';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../schemas/auth.schema';

export class AuthService {
  static async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email already in use');
    }

    const hashedPassword = await hashPassword(data.password);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
      },
    });

    return { message: 'User created successfully' };
  }

  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await verifyPassword(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = generateToken({ userId: user.id });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  static async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
