class SMSService {
  private baseUrl: string;
  private apiKey: string;
  private lineNumber: string;

  constructor() {
    // در Vite باید از import.meta.env استفاده کنیم
    this.baseUrl = import.meta.env.VITE_SMS_API_BASE_URL || "https://sms.yourdomain.com";
    this.apiKey = import.meta.env.VITE_SMS_API_KEY || "";
    this.lineNumber = import.meta.env.VITE_SMS_LINE_NUMBER || "";
  }

  async send(to: string, text: string) {
    try {
      const res = await fetch(`${this.baseUrl}/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": this.apiKey,
        },
        body: JSON.stringify({
          mobile: to,
          message: text,
          sender: this.lineNumber,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "خطا در ارسال پیامک");
      }

      return data;
    } catch (error: any) {
      console.error("SMS Error:", error.message);
      throw error;
    }
  }
}

const smsService = new SMSService();
export { smsService };
