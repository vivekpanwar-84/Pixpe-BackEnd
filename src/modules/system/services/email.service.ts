import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('BREVO_SMTP_HOST', 'smtp-relay.brevo.com'),
      port: this.configService.get<number>('BREVO_SMTP_PORT', 587),
      secure: false, // Brevo SMTP port 587 uses STARTTLS (not direct SSL)
      auth: {
        user: this.configService.get<string>('BREVO_SMTP_USER'),
        pass: this.configService.get<string>('BREVO_SMTP_PASS'),
      },
    });
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: this.configService.get<string>('BREVO_SMTP_FROM', '"Pixpe System" <noreply@pixpe.com>'),
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





// import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// // @ts-ignore
// import SibApiV3Sdk from 'sib-api-v3-sdk';

// @Injectable()
// export class EmailService {
//   private readonly logger = new Logger(EmailService.name);
//   private apiInstance;

//   constructor(private configService: ConfigService) {
//     const client = SibApiV3Sdk.ApiClient.instance;

//     client.authentications['api-key'].apiKey =
//       this.configService.get<string>('BREVO_API_KEY');

//     this.apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
//   }

//   async sendMail(to: string, subject: string, html: string) {
//     try {
//       const result = await this.apiInstance.sendTransacEmail({
//         sender: {
//           email: 'noreply@pixpe.com',
//           name: 'Pixpe System',
//         },
//         to: [{ email: to }],
//         subject,
//         htmlContent: html,
//       });

//       this.logger.log(`Email sent to ${to}`);
//       return result;
//     } catch (error) {
//       this.logger.error(`Email failed`, error);
//       throw error;
//     }
//   }

//   async sendOtp(email: string, otp: string) {
//     const subject = 'Your Pixpe Verification Code';
//     const html = `
//         <div style="font-family: Arial, sans-serif; padding: 20px;">
//             <h2>Pixpe Verification</h2>
//             <p>Your verification code is:</p>
//             <h1 style="color: #4CAF50;">${otp}</h1>
//             <p>It expires in 10 minutes.</p>
//             <p>If you did not request this code, please ignore this email.</p>
//         </div>
//       `;
//     return this.sendMail(email, subject, html);
//   }
// }
