import { test } from "node:test";
import assert from "node:assert/strict";
import { billFromKwh, calculateSolar, estimateSavingForKwp, kwhFromBill, regionOf, type CalculatorParams } from "../solarCalculator";
import { CALCULATOR_PARAMS, TARIFFS } from "./fixtures";
import { formatMoneyShort, formatNumber, parseNumber } from "../format";
import { isVnMobile, normalizeVnPhone } from "../phone";
import { discountPercent, priceView, resolvePrice } from "../price";

const close = (actual: number, expected: number, tolerance = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} ≉ ${expected}`);

test("hộ gia đình – TP HCM – 2 triệu/tháng: tính ngược bậc thang", () => {
  const r = calculateSolar({ segment: "household", monthlyBill: 2_000_000, roofArea: 40, province: "TP Hồ Chí Minh", daytimeRatio: 40 }, CALCULATOR_PARAMS);
  // 2.000.000 / 1,08 = 1.851.851,85 đ → hết bậc 5 (400 kWh = 1.074.500 đ) + 777.351,85 / 3.460 = 224,67 kWh
  close(r.monthlyKwh, 624.67);
  close(r.daytimeKwh, 249.87);
  assert.equal(r.region, "nam-bo");
  close(r.kwpNeeded, 2.263, 0.001);      // 249,87 / (30 × 4,6 × 0,8)
  assert.equal(r.kwp, 2.5);
  assert.equal(r.limitedByRoof, false);
  assert.equal(r.panels, 5);             // ceil(2500 / 580)
  assert.equal(r.cost, 30_000_000);
  // Sản lượng 276 kWh > nhu cầu ban ngày → tiết kiệm = phần bậc cao nhất bị cắt bỏ
  close(r.monthlySavings, 930_710, 1); // (1.851.851,85 − bill(374,80 kWh) 990.083,4) × 1,08
  close(r.paybackYears, 2.686, 0.001);
});

test("cửa hàng – Hà Nội – 8 triệu/tháng", () => {
  const r = calculateSolar({ segment: "shop", monthlyBill: 8_000_000, roofArea: 120, province: "Hà Nội", daytimeRatio: 70 }, CALCULATOR_PARAMS);
  close(r.monthlyKwh, 2244.67);          // 8.000.000 / 1,08 / 3.300
  assert.equal(r.region, "bac-bo");
  assert.equal(r.kwp, 18.5);             // 1.571,27 / (30 × 3,5 × 0,8) = 18,71 → 18,5
  assert.equal(r.kwpRoofMax, 21.5);
  assert.equal(r.panels, 32);
  assert.equal(r.cost, 203_500_000);
  close(r.monthlyProduction, 1554);
  close(r.monthlySavings, 1554 * 3150 * 1.08, 1);
  close(r.paybackYears, 3.21, 0.01);
});

test("nhà xưởng – Đồng Nai – 80 triệu/tháng, mái lớn", () => {
  const r = calculateSolar({ segment: "factory", monthlyBill: 80_000_000, roofArea: 5_000, province: "Đồng Nai", daytimeRatio: 80 }, CALCULATOR_PARAMS);
  close(r.monthlyKwh, 36_133.69, 0.01); // 80.000.000 / 1,08 / 2.050
  assert.equal(r.kwp, 262);
  assert.equal(r.limitedByRoof, false);
  assert.equal(r.panels, 452);
  assert.equal(r.cost, 2_489_000_000);
  // sản lượng 28.924,8 kWh vượt nhẹ nhu cầu ban ngày → chỉ tính phần tự dùng
  close(r.monthlySavings, r.daytimeKwh * 1900 * 1.08, 1);
  assert.ok(r.paybackYears > 3 && r.paybackYears < 4);
});

test("trang trại – Đồng Tháp – 25 triệu/tháng", () => {
  const r = calculateSolar({ segment: "farm", monthlyBill: 25_000_000, roofArea: 1_200, province: "Đồng Tháp", daytimeRatio: 70 }, CALCULATOR_PARAMS);
  close(r.monthlyKwh, 10_288.07, 0.01);  // 25.000.000 / 1,08 / 2.250
  assert.equal(r.region, "nam-bo");
  close(r.kwpNeeded, 65.24, 0.01);       // 7.201,65 / (30 × 4,6 × 0,8)
  assert.equal(r.kwp, 65);
  assert.equal(r.limitedByRoof, false);  // mái 1.200 m² đủ cho 218 kWp
  assert.equal(r.panels, 113);           // ceil(65.000 / 580)
  assert.equal(r.cost, 650_000_000);
  close(r.monthlySavings, 65 * 4.6 * 30 * 0.8 * 2100 * 1.08, 1);
  assert.ok(r.paybackYears > 3 && r.paybackYears < 4);
});

test("bị giới hạn bởi diện tích mái", () => {
  const r = calculateSolar({ segment: "factory", monthlyBill: 80_000_000, roofArea: 800, province: "Đồng Nai", daytimeRatio: 80 }, CALCULATOR_PARAMS);
  assert.equal(r.kwpRoofMax, 145);       // 800 / 5,5 = 145,45 → làm tròn xuống 145
  assert.equal(r.kwp, 145);
  assert.equal(r.limitedByRoof, true);
  assert.equal(r.panels, 250);           // 145.000 / 580 = 250 đúng
  close(r.monthlySavings, 145 * 4.6 * 30 * 0.8 * 1900 * 1.08, 1);
});

test("mái tối thiểu 16 m² luôn cho hệ ≥ 0,5 kWp và kWp chia hết 0,5", () => {
  const r = calculateSolar({ segment: "household", monthlyBill: 600_000, roofArea: 16, province: "Huế", daytimeRatio: 40 }, CALCULATOR_PARAMS);
  assert.ok(r.kwp > 0 && r.kwp <= 2.5);
  assert.equal(r.kwp % 0.5, 0);
});

test("bậc thang: tính xuôi và tính ngược khớp nhau", () => {
  for (const kwh of [0, 30, 50, 120, 399, 400, 1234]) close(kwhFromBill(billFromKwh(kwh, TARIFFS.household), TARIFFS.household), kwh, 1e-6);
});

test("định dạng số tiền", () => {
  assert.equal(formatNumber(1_000_000), "1.000.000");
  assert.equal(parseNumber("1.000.000"), 1_000_000);
  assert.equal(formatMoneyShort(180_000_000), "180 triệu");
  assert.equal(formatMoneyShort(100_000_000), "100 triệu");
  assert.equal(formatMoneyShort(3_450_000), "3,5 triệu");
  assert.equal(formatMoneyShort(2_000_000), "2 triệu");
  assert.equal(formatMoneyShort(1_200_000_000), "1,2 tỷ");
  assert.equal(formatMoneyShort(2_000_000_000), "2 tỷ");
});

test("số di động Việt Nam", () => {
  for (const ok of ["0901234567", "090 123 4567", "+84 912 345 678", "0389.123.456", "0868123456"]) assert.ok(isVnMobile(ok), ok);
  for (const bad of ["0281234567", "12345", "09012345678", "0101234567", ""]) assert.ok(!isVnMobile(bad), bad);
  assert.equal(normalizeVnPhone("+84 912-345-678"), "0912345678");
});

test("tiết kiệm của gói 5 kWp hộ gia đình tại TP HCM", () => {
  // 5 × 4,6 × 30 × 0,8 = 552 kWh × 3.460 đ × 1,08
  close(estimateSavingForKwp("household", 5, "TP Hồ Chí Minh", CALCULATOR_PARAMS), 552 * 3460 * 1.08, 1);
});

test("salePrice chỉ hiển thị khi nhỏ hơn price", () => {
  assert.deepEqual(resolvePrice(100, 90), { current: 90, original: 100 });
  assert.deepEqual(resolvePrice(100, 120), { current: 100, original: undefined });
  assert.deepEqual(resolvePrice(100, 100), { current: 100, original: undefined });
  assert.deepEqual(resolvePrice(100), { current: 100, original: undefined });
  assert.deepEqual(resolvePrice(undefined, 50), { current: undefined, original: undefined });
});

test("nhãn 'Giảm Y%' chỉ hiện khi Y ≥ 5; không có giá → Liên hệ", () => {
  assert.equal(discountPercent(1_000_000, 900_000), 10);
  assert.deepEqual(priceView(1_000_000, 900_000), { kind: "price", current: 900_000, original: 1_000_000, badge: 10 });
  // giảm 3%: vẫn hiện giá giảm + giá gạch ngang nhưng KHÔNG gắn nhãn
  assert.deepEqual(priceView(1_000_000, 970_000), { kind: "price", current: 970_000, original: 1_000_000, badge: undefined });
  // đúng ngưỡng 5%
  assert.deepEqual(priceView(1_000_000, 950_000), { kind: "price", current: 950_000, original: 1_000_000, badge: 5 });
  // salePrice ≥ price: bỏ qua giá giảm
  assert.deepEqual(priceView(1_000_000, 1_200_000), { kind: "price", current: 1_000_000, original: undefined, badge: undefined });
  assert.deepEqual(priceView(undefined), { kind: "contact" });
  assert.deepEqual(priceView(0, 0), { kind: "contact" });
});

test("dự toán nhận toàn bộ hệ số từ CalculatorParams, không dùng cấu hình web", () => {
  const params: CalculatorParams = {
    tariffs: { ...TARIFFS, shop: { kind: "flat", averageRate: 1000, solarOffsetRate: 500 } },
    vatRate: 0.2,
    pricePerKwp: { household: 100_000, shop: 200_000, factory: 300_000, farm: 400_000 },
    peakSunHours: { "bac-bo": 1, "bac-trung-bo": 2, "nam-trung-bo": 3, "tay-nguyen": 4, "nam-bo": 5 },
    provinces: [{ name: "Tỉnh mẫu", region: "bac-bo" }],
    system: { performanceRatio: 0.5, m2PerKwp: 10, panelWatt: 250, kwpStep: 2, minKwp: 4 },
  };
  const r = calculateSolar({ segment: "shop", monthlyBill: 120_000, roofArea: 100, province: "Tỉnh mẫu", daytimeRatio: 100 }, params);
  assert.equal(r.monthlyKwh, 100);
  assert.equal(r.peakSunHours, 1);
  assert.equal(r.kwpRoofMax, 10);
  assert.equal(r.kwp, 6);
  assert.equal(r.panels, 24);
  assert.equal(r.cost, 1_200_000);
  assert.equal(r.monthlyProduction, 90);
  assert.equal(r.monthlySavings, 54_000);
  close(r.paybackYears, 1_200_000 / (54_000 * 12));
  assert.equal(estimateSavingForKwp("shop", 6, "Tỉnh mẫu", params), 54_000);
  const minimum = calculateSolar({ segment: "shop", monthlyBill: 0, roofArea: 100, province: "Tỉnh mẫu", daytimeRatio: 0 }, params);
  assert.equal(minimum.kwp, 4);
  assert.equal(minimum.paybackYears, Infinity);
});

test("dự toán: mái rỗng, giá trị âm và tỷ lệ ban ngày ngoài khoảng", () => {
  const input = { segment: "shop" as const, monthlyBill: -1, roofArea: -1, province: "Hà Nội", daytimeRatio: -10 };
  const r = calculateSolar(input, CALCULATOR_PARAMS);
  assert.equal(r.monthlyKwh, 0);
  assert.equal(r.daytimeKwh, 0);
  assert.equal(r.kwp, 0);
  assert.equal(r.panels, 0);
  assert.equal(r.monthlySavings, 0);
  assert.equal(r.paybackYears, Infinity);
  const fullDay = calculateSolar({ ...input, monthlyBill: 8_000_000, roofArea: 100, daytimeRatio: 150 }, CALCULATOR_PARAMS);
  assert.equal(fullDay.daytimeKwh, fullDay.monthlyKwh);
  assert.throws(() => regionOf("Không tồn tại", CALCULATOR_PARAMS.provinces), /Không có tỉnh/);
  assert.equal(regionOf("Hà Nội", CALCULATOR_PARAMS.provinces), "bac-bo");
  assert.equal(billFromKwh(-1, TARIFFS.household), 0);
  assert.equal(kwhFromBill(-1, TARIFFS.shop), 0);
  const capped = { kind: "tiered" as const, tiers: [{ upTo: 10, price: 100 }] };
  assert.equal(kwhFromBill(2000, capped), 10);
});

test("đổi giá điện trong params → kWh quy đổi và tiết kiệm đổi theo", () => {
  const input = { segment: "shop", monthlyBill: 8_000_000, roofArea: 1_000, province: "Hà Nội", daytimeRatio: 70 } as const;
  const base = calculateSolar(input, CALCULATOR_PARAMS);
  const pricier: CalculatorParams = {
    ...CALCULATOR_PARAMS,
    tariffs: { ...CALCULATOR_PARAMS.tariffs, shop: { kind: "flat", averageRate: 3300 * 1.1, solarOffsetRate: 3150 * 1.1 } },
  };
  const r = calculateSolar(input, pricier);
  // Cùng hóa đơn, giá cao hơn 10% → ít kWh hơn đúng tỉ lệ 1/1,1.
  close(r.monthlyKwh, base.monthlyKwh / 1.1);
  assert.ok(r.kwp < base.kwp);
  close(r.monthlySavings, r.monthlyProduction * 3150 * 1.1 * 1.08, 1);

  const household = { segment: "household", monthlyBill: 2_000_000, roofArea: 100, province: "Huế", daytimeRatio: 40 } as const;
  const tiers = CALCULATOR_PARAMS.tariffs.household;
  assert.equal(tiers.kind, "tiered");
  const raised: CalculatorParams = {
    ...CALCULATOR_PARAMS,
    tariffs: { ...CALCULATOR_PARAMS.tariffs, household: { kind: "tiered", tiers: tiers.tiers.map((t) => ({ ...t, price: t.price * 2 })) } },
  };
  assert.ok(calculateSolar(household, raised).monthlyKwh < calculateSolar(household, CALCULATOR_PARAMS).monthlyKwh);
});
