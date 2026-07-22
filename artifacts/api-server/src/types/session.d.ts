import "express-session";

declare module "express-session" {
  interface SessionData {
    userId: string;
    companyId: string;
    userName: string;
    userRole: string;
    userEmail: string;
  }
}
