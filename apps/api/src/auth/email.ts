import type { AppLogger } from '../common/logger';

export interface EmailSender {
  sendVerification(message: { to: string; link: string }): Promise<void>;
  sendPasswordReset(message: { to: string; link: string }): Promise<void>;
  sendAccountExists(message: { to: string }): Promise<void>;
}

/** Development only: prints emails (with their secret links) to the log. Blocked in production. */
export class ConsoleEmailSender implements EmailSender {
  constructor(private readonly logger: AppLogger) {}
  async sendVerification(message: { to: string; link: string }): Promise<void> {
    this.logger.info({ ...message, kind: 'verify-email' }, 'DEV EMAIL');
  }
  async sendPasswordReset(message: { to: string; link: string }): Promise<void> {
    this.logger.info({ ...message, kind: 'reset-password' }, 'DEV EMAIL');
  }
  async sendAccountExists(message: { to: string }): Promise<void> {
    this.logger.info({ ...message, kind: 'account-exists' }, 'DEV EMAIL');
  }
}

/** Used when EMAIL_TRANSPORT=disabled: sends nothing. */
export class NoopEmailSender implements EmailSender {
  async sendVerification(): Promise<void> {}
  async sendPasswordReset(): Promise<void> {}
  async sendAccountExists(): Promise<void> {}
}
