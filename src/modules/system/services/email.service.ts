import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('SMTP_HOST'),
            port: this.configService.get<number>('SMTP_PORT'),
            secure: this.configService.get<string>('SMTP_SECURE') === 'true', // correctly parse string "false"
            auth: {
                user: this.configService.get<string>('SMTP_USER'),
                pass: this.configService.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendMail(to: string, subject: string, text: string, html?: string) {
        try {
            const info = await this.transporter.sendMail({
                from: this.configService.get<string>('SMTP_FROM', '"Pixpe System" <noreply@pixpe.com>'),
                to,
                subject,
                text,
                html,
            });
            this.logger.log(`Email sent to ${to}: ${info.messageId}`);
            return info;
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
