import { describe, expect, it } from "vitest";
import { buildOrderConfirmationMail, buildOrderStatusMail } from "./customer-emails";
import { canCustomerCancel, isOrderStatus, ORDER_STATUS, orderStatusLabel } from "./orders";

describe("orders", () => {
  it("recognizes statuses", () => {
    expect(isOrderStatus("new")).toBe(true);
    expect(isOrderStatus("nope")).toBe(false);
    expect(orderStatusLabel("confirmed")).toBe("Подтверждён");
  });

  it("allows customer cancel only early", () => {
    expect(canCustomerCancel(ORDER_STATUS.NEW)).toBe(true);
    expect(canCustomerCancel(ORDER_STATUS.DONE)).toBe(false);
  });
});

describe("customer emails", () => {
  const order = {
    number: "AM-TEST",
    total: 1500,
    customerName: "Иван",
    customerEmail: "ivan@example.com",
    fulfillment: "pickup",
    status: "new",
    items: [{ name: "Бумага", quantity: 2, price: 750 }],
  };

  it("builds confirmation mail", () => {
    const mail = buildOrderConfirmationMail(order);
    expect(mail.subject).toContain("AM-TEST");
    expect(mail.text).toContain("принят");
    expect(mail.text).toContain("Бумага");
  });

  it("builds status mail", () => {
    const mail = buildOrderStatusMail({ ...order, status: "ready" });
    expect(mail.subject).toContain("Готов к выдаче");
    expect(mail.text).toContain("изменён");
  });
});
