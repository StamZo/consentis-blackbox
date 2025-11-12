// src/types/express.d.ts
import "express-serve-static-core";

declare module "express-serve-static-core" {
  interface Request {
    userPayload?: {
      selected_peer?: string;
      username?: string;
      // add any other fields you decode from your JWT
    };
  }
}
