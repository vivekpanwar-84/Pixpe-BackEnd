import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BrevoClient } from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: BrevoClient;

  constructor(private configService: ConfigService) {
    this.client = new BrevoClient({
      apiKey: this.configService.get<string>('API_V3_KEY')!,
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const response = await this.client.transactionalEmails.sendTransacEmail({
        to: [{ email: to }],
        subject: subject,
        textContent: text,
        htmlContent: html,
        sender: {
          name: 'Pixpe System',
          email: this.configService.get<string>('BREVO_FROM_EMAIL'),
        },
      });
      this.logger.log(`Email sent to ${to}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);
      throw error;
    }
  }

  async sendOtp(email: string, otp: string) {
    const subject = 'Your Pixpe Verification Code';
    const text = `Your verification code is: ${otp}. It expires in 10 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Pixpe Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #4CAF50;">${otp}</h1>
        <p>It expires in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `;
    return this.sendMail(email, subject, text, html);
  }
}
