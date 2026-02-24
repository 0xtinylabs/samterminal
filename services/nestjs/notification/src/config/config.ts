export const configs = {
  botTokens: {
    main: process.env.MAIN_BOT_TOKEN ?? '',
    user: process.env.USER_BOT_TOKEN ?? '',
  },
  group_ids: {
    main: process.env.MAIN_GROUP_CHAT_ID ?? '',
  },
};

// Validate required environment variables (skip in test environment)
if (process.env.NODE_ENV !== 'test') {
  const requiredEnvVars = ['USER_BOT_TOKEN'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
