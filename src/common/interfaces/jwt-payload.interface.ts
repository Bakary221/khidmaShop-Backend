export interface JwtPayload {
  sub: string; // userId
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  iat: number;
  exp: number;
}
