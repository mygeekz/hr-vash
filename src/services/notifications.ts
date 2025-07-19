/**
 * سرویس اعلان‌ها (in‑app + SMS)
 * تمام فراخوانی‌های HTTP از Helper مشترک استفاده می‌کنند
 */
import { get, post } from "@/lib/http";
import { smsService } from "./sms";

/* ------------------------------------------------------------------ */
/* انواع                                                             */
/* ------------------------------------------------------------------ */

export interface Notification {
  id: number;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type: "request" | "approval" | "system";
}

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: "request" | "approval" | "system";
}

/* ------------------------------------------------------------------ */
/* سرویس اعلان                                                         */
/* ------------------------------------------------------------------ */

class NotificationService {
  private subscribers: Array<(n: Notification) => void> = [];
  private readonly base = "/notifications";

  /** ایجاد اعلان جدید (همه جا استفاده می‌شود) */
  private async create(payload: NotificationPayload): Promise<Notification> {
    const notif = await post<Notification>(this.base, payload);
    this.subscribers.forEach((cb) => cb(notif));
    return notif;
  }

  /* ------------------------- رویدادهای خاص ------------------------- */

  /** وقتی کارمند یک درخواست جدید ثبت می‌کند */
  async newRequest(
    employeeName: string,
    requestType: string,
    managerMobile: string,
    managerId: string
  ) {
    /* اعلان داخل برنامه */
    await this.create({
      userId: managerId,
      title: "درخواست جدید",
      body: `${employeeName} درخواست ${requestType} ارسال کرده است`,
      type: "request"
    });

    /* پیامک */
    try {
      await smsService.sendNewRequestNotification(
        managerMobile,
        employeeName,
        requestType
      );
    } catch (err) {
      console.error("❌ SMS Error (newRequest):", err);
    }
  }

  /** وقتی درخواست تأیید یا رد می‌شود */
  async requestStatus(
    employeeName: string,
    requestType: string,
    status: "approved" | "rejected",
    employeeMobile: string,
    employeeId: string
  ) {
    /* اعلان داخل برنامه */
    await this.create({
      userId: employeeId,
      title: status === "approved" ? "درخواست تایید شد" : "درخواست رد شد",
      body: `درخواست ${requestType} شما ${
        status === "approved" ? "تایید" : "رد"
      } شد`,
      type: "approval"
    });

    /* پیامک */
    try {
      await smsService.sendRequestStatusNotification(
        employeeMobile,
        employeeName,
        status
      );
    } catch (err) {
      console.error("❌ SMS Error (requestStatus):", err);
    }
  }

  /* --------------------- متدهای عمومی کمکی ------------------------- */

  /** دریافت اعلان‌های یک کاربر */
  // <<< تغییر اصلی: نام تابع به getNotifications تغییر کرد >>>
  getNotifications(userId: string) {
    return get<Notification[]>(`${this.base}?userId=${userId}`);
  }

  /** علامت‌گذاری به عنوان خوانده‌شده */
  markAsRead(id: number) {
    return post(`${this.base}/${id}/read`, {}, "PUT");
  }

  /** سابسکرایب برای دریافت اعلان‌های جدید در همان تب */
  subscribe(cb: (n: Notification) => void) {
    this.subscribers.push(cb);
    /* تابع لغو عضویت */
    return () => {
      this.subscribers = this.subscribers.filter((fn) => fn !== cb);
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;