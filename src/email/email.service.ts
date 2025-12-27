import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
  async send(email: string, message: string): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    try {
      const response = await fetch(
        'https://email-service.digitalenvision.com.au/send-email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            message,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        throw new Error(`Email API error: ${response.status}`);
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
