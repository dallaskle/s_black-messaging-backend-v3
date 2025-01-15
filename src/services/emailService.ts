import nodemailer from 'nodemailer';
import { config } from '../config';
import AppError from '../types/AppError';

interface WorkspaceInviteEmailParams {
  to: string;
  inviterName: string;
  workspaceName: string;
  inviteLink: string;
  expiresIn?: number;
}

// Create reusable transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail', // Using Gmail's predefined settings
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_APP_PASSWORD // Gmail App Password
  }
});

export const emailService = {
  async sendWorkspaceInvite({
    to,
    inviterName,
    workspaceName,
    inviteLink,
    expiresIn
  }: WorkspaceInviteEmailParams): Promise<void> {
    try {
      const expiryText = expiresIn 
        ? `This invitation will expire in ${Math.floor(expiresIn / (1000 * 60 * 60))} hours.`
        : 'This invitation has no expiration date.';

      const mailOptions = {
        from: `"S_Black Messaging" <${process.env.EMAIL_USER}>`,
        to,
        subject: `${inviterName} invited you to join ${workspaceName}`,
        html: `
          <h2>You've been invited to join ${workspaceName}</h2>
          <p>${inviterName} has invited you to join their workspace on our platform.</p>
          <p>${expiryText}</p>
          <p>
            <a href="${inviteLink}" style="
              background-color: #4CAF50;
              border: none;
              color: white;
              padding: 15px 32px;
              text-align: center;
              text-decoration: none;
              display: inline-block;
              font-size: 16px;
              margin: 4px 2px;
              cursor: pointer;
              border-radius: 4px;
            ">
              Accept Invitation
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p>${inviteLink}</p>
          <p>If you don't want to join, you can ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('[emailService] Invitation email sent successfully to:', to);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      throw new AppError('Failed to send invitation email', 500);
    }
  }
}; 