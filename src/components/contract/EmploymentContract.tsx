// src/components/contract/EmploymentContract.tsx
import React, { forwardRef } from "react";

/** تمام فیلدهای قرارداد */
export type ContractData = {
  employerName: string;
  employerNatId: string;
  employerAddress: string;
  employerPhone: string;

  employeeName: string;
  employeeNatId: string;
  employeeBirth: string;
  employeeAddress: string;
  employeePhone: string;
  employeeEdu: string;

  position: string;
  contractStart: string;
  contractEnd: string;

  workingHoursFrom: string;
  workingHoursTo: string;

  salary: string;
  benefits?: string;
  dutiesText?: string;
  termination?: string;
  other?: string;
};

/**
 * می‌توانی همه مقادیر را در prop به نام data بدهی
 * یا هرکدام را به‌صورت جداگانه پاس بدهی.
 */
type Props = { data?: Partial<ContractData> } & Partial<ContractData>;

// مقادیر پیش‌فرض تا از خطای undefined جلوگیری شود
const defaults: ContractData = {
  employerName: "",
  employerNatId: "",
  employerAddress: "",
  employerPhone: "",

  employeeName: "",
  employeeNatId: "",
  employeeBirth: "",
  employeeAddress: "",
  employeePhone: "",
  employeeEdu: "",

  position: "",
  contractStart: "",
  contractEnd: "",

  workingHoursFrom: "",
  workingHoursTo: "",

  salary: "",
  benefits: "",
  dutiesText: "",
  termination: "",
  other: "",
};

const EmploymentContract = forwardRef<HTMLDivElement, Props>((props, ref) => {
  // ادغام data و پراپ‌های تکی با مقادیر پیش‌فرض
  const d: ContractData = {
    ...defaults,
    ...(props.data ?? {}),
    ...props,
  };

  return (
    <div ref={ref} className="print-page text-sm leading-7 space-y-4" dir="rtl">
      <h2 className="text-center text-xl font-bold mb-6">قرارداد کار</h2>

      {/* مشخصات طرفین */}
      <section>
        <h3 className="font-semibold mb-2">مشخصات طرفین قرارداد</h3>

        <p><b>کارفرما:</b></p>
        <p>نام/شرکت: {d.employerName || "............................"}</p>
        <p>شماره ملی/شناسه: {d.employerNatId || "............................"}</p>
        <p>نشانی محل کار: {d.employerAddress || "........................................"}</p>
        <p>شماره تماس: {d.employerPhone || ".................."}</p>

        <p className="mt-4"><b>کارگر / کارمند:</b></p>
        <p>نام و نام خانوادگی: {d.employeeName || "............................"}</p>
        <p>شماره ملی: {d.employeeNatId || "............................"}</p>
        <p>تاریخ تولد: {d.employeeBirth || ".......... / .......... / .........."}</p>
        <p>نشانی محل سکونت: {d.employeeAddress || "........................................"}</p>
        <p>شماره تماس: {d.employeePhone || ".................."}</p>
        <p>تحصیلات / تخصص: {d.employeeEdu || "............................"}</p>
      </section>

      {/* نوع و موضوع قرارداد */}
      <section>
        <h3 className="font-semibold mb-2">نوع قرارداد</h3>
        <p>
          این قرارداد از نوع مدت معین بوده و از تاریخ{" "}
          {d.contractStart || ".......... / .......... / .........."} تا تاریخ{" "}
          {d.contractEnd || ".......... / .......... / .........."} بین طرفین منعقد می‌شود.
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">موضوع قرارداد</h3>
        <p>
          موضوع قرارداد عبارت است از همکاری در سمت «{d.position || "................................"}». کارگر
          متعهد می‌شود وظایف محوله را طبق شرح وظایف پیوست قرارداد و مطابق دستورات کارفرما انجام دهد.
        </p>
        {d.dutiesText && <p className="mt-2">شرح وظایف: {d.dutiesText}</p>}
      </section>

      {/* محل و ساعت کار */}
      <section>
        <h3 className="font-semibold mb-2">محل انجام کار</h3>
        <p>
          محل کار اصلی در آدرس ذکرشده کارفرما می‌باشد. در صورت نیاز، کارگر موظف به همکاری در سایر محل‌های
          معرفی‌شده توسط کارفرما خواهد بود.
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">ساعات کار</h3>
        <p>
          ساعات کاری از ساعت {d.workingHoursFrom || "........"} الی {d.workingHoursTo || "........"} می‌باشد.
        </p>
      </section>

      {/* حقوق و مزایا */}
      <section>
        <h3 className="font-semibold mb-2">حقوق و مزایا</h3>
        <p>مبلغ حقوق ماهیانه: {d.salary || "..................... ریال"}</p>
        <p>نحوه پرداخت: در پایان هر ماه</p>
        <p>سایر مزایا: {d.benefits || "پرداخت عیدی کامل در پایان سال"}</p>
      </section>

      {/* تعهدات */}
      <section>
        <h3 className="font-semibold mb-2">تعهدات کارگر</h3>
        <ul className="list-disc pr-6 space-y-1">
          <li>رعایت نظم و انضباط و مقررات داخلی کارگاه/شرکت</li>
          <li>اجرای دقیق وظایف محوله طبق شرح وظایف</li>
          <li>حفظ اسرار کاری و اطلاعات محرمانه مجموعه</li>
        </ul>
      </section>

      <section>
        <h3 className="font-semibold mb-2">تعهدات کارفرما</h3>
        <ul className="list-disc pr-6 space-y-1">
          <li>پرداخت به‌موقع حقوق و مزایا مطابق قرارداد</li>
          <li>تأمین محیط ایمن و بهداشتی برای انجام کار</li>
          <li>ارائه گواهی پایان همکاری در صورت درخواست کارگر</li>
        </ul>
      </section>

      {/* فسخ و سایر */}
      <section>
        <h3 className="font-semibold mb-2">فسخ قرارداد</h3>
        <p>
          {d.termination ||
            "قرارداد طبق شرایط مقرر در قانون کار و با اعلام کتبی یکی از طرفین و پس از طی تشریفات قانونی قابل فسخ خواهد بود."}
        </p>
      </section>

      <section>
        <h3 className="font-semibold mb-2">سایر موارد</h3>
        <p>
          {d.other ||
            "موارد پیش‌بینی‌نشده در این قرارداد تابع قانون کار، آیین‌نامه‌ها و بخشنامه‌های مرتبط خواهد بود."}
        </p>
      </section>

      {/* امضا */}
      <section className="mt-8">
        <p className="mb-2">امضای طرفین قرارداد:</p>
        <div className="flex justify-between mt-6">
          <div className="w-1/2 pr-4">
            <p>کارفرما:</p>
            <p>نام و نام خانوادگی: </p>
            <p>امضا: </p>
          </div>
          <div className="w-1/2 pl-4">
            <p>کارگر / کارمند:</p>
            <p>نام و نام خانوادگی: </p>
            <p>امضا: </p>
          </div>
        </div>
        <p className="mt-6 text-left">تاریخ امضا: </p>
      </section>
    </div>
  );
});

export default EmploymentContract;
