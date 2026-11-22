# Real Estate as Investment — Decision Checklist

Use this checklist to lock product choices before implementation.
Check **one** option per question (unless noted).

**Status:** Draft — fill in before Phase 1 coding
**Related PRD:** Feature — Real Estate Portfolio (Primary + Rental)

---

## 1. MVP scope

What should Phase 1 include?

- [ ] **Primary residence only** (value, mortgage, equity, appreciation; not withdrawable)
- [ ] **Rental property only** (value, mortgage, equity, appreciation + net rental income)
- [ ] **Both primary and rental** (full PRD MVP)
- [ ] **Something else:** _______________________________

---

## 2. Property ownership model

Where do properties live in the app?

- [ ] **Global** (like Accounts / Other Income — one set for all scenarios)
- [ ] **Per saved scenario** (each scenario can have different properties)
- [ ] **Global with optional per-scenario overrides**
- [ ] **Something else:** _______________________________

---

## 3. Primary residence and withdrawals

How should the primary home interact with the liquid portfolio?

- [ ] **Never liquid** — excluded from withdrawal pool; equity only on net worth
- [ ] **Never liquid by default**, but user can mark “available for withdrawal”
- [ ] **Optional sale / downsize event** in MVP (year of sale, proceeds → portfolio)
- [ ] **Sale / downsize deferred** to Phase 2
- [ ] **Something else:** _______________________________

---

## 4. Mortgage modeling (MVP)

How detailed should debt modeling be?

- [ ] **Simple** — current balance, monthly payment, interest rate; reduce balance by principal estimate each year
- [ ] **Amortization schedule** — full amortizing mortgage from remaining term / loan inputs
- [ ] **Payment only** — track payment as expense; don’t track balance paydown in MVP
- [ ] **No mortgage in MVP** — value / equity only (debt entered as equity reduction or ignored)
- [ ] **Something else:** _______________________________

---

## 5. Rental income vs Other Income

How should rental cash flow relate to existing Other Income (`rental` type)?

- [ ] **Properties own the income** — net rent comes only from Real Estate properties (discourage duplicate Other Income rentals)
- [ ] **Keep both** — user can still add Other Income `rental`; properties add additional net income
- [ ] **Migrate / link** — existing Other Income rental rows can be converted or linked to a property
- [ ] **Something else:** _______________________________

---

## 6. Rental expense assumptions (MVP)

What rental cost model do we need day one?

- [ ] **Simple % of gross rent** — vacancy % + maintenance % (and optional fixed HOA/tax)
- [ ] **Fixed monthly costs** — user enters vacancy/maintenance/taxes as dollars
- [ ] **Gross rent only** — net = gross (no vacancy/maintenance in MVP)
- [ ] **Something else:** _______________________________

---

## 7. Appreciation

How do property values grow?

- [ ] **Single appreciation rate per property** (user-entered %)
- [ ] **Defaults by type** (e.g. primary 2%, rental 3%) with per-property override
- [ ] **Tied to scenario inflation** by default, with override
- [ ] **Something else:** _______________________________

---

## 8. Taxes (MVP)

How much tax treatment in Phase 1?

- [ ] **None** — rental net income treated like other taxable/non-taxable income flag only
- [ ] **Light** — rental net is taxable income; no depreciation / 1031 / Cap gains
- [ ] **Depreciation** in MVP
- [ ] **Sale capital gains** in MVP
- [ ] **Defer complex tax** (depreciation, gains, 1031) to Phase 2+
- [ ] **Something else:** _______________________________

*(Check all that apply for this section.)*

---

## 9. Net worth reporting

What must show in projections / UI for MVP?

- [ ] Liquid portfolio balance (accounts) — **required anyway**
- [ ] Real estate **market value**
- [ ] Real estate **equity** (value − mortgage)
- [ ] **Total net worth** = liquid + RE equity
- [ ] Separate primary vs rental equity
- [ ] Charts / Visualizations page for RE over time
- [ ] Scenario comparison includes RE / net worth
- [ ] **Something else:** _______________________________

*(Check all that apply.)*

---

## 10. Monte Carlo

Should Monte Carlo include real estate in Phase 1?

- [ ] **No** — MC stays liquid-portfolio only; RE is deterministic projection only
- [ ] **Income only** — rental net income flows into MC spending/withdrawal logic; no RE price risk
- [ ] **Full** — stochastic appreciation / value paths for properties
- [ ] **Defer all RE–MC integration** to Phase 2+
- [ ] **Something else:** _______________________________

---

## 11. UI placement

Where should users manage properties?

- [ ] **New top-level page:** Real Estate (like Accounts / Other Income)
- [ ] **Section under Accounts**
- [ ] **Section under Other Income**
- [ ] **Inside Scenario editor only**
- [ ] **Something else:** _______________________________

---

## 12. Phase order preference

If we can’t do everything at once, preferred sequence:

- [ ] **A then B then C:** CRUD + projection equity → rental income → sale events / MC / tax
- [ ] **Rental-first:** income-producing properties before primary residence
- [ ] **Primary-first:** home equity / net worth before rental modeling
- [ ] **Something else:** _______________________________

---

## 13. Open notes / constraints

Capture anything else that should drive design:

- Target user for this feature: _______________________________
- Must-have for first demo: _______________________________
- Explicit non-goals for MVP: _______________________________
- Deadline / urgency: _______________________________

---

## Decision summary (fill after checking above)

| Topic | Decision |
|-------|----------|
| MVP scope | |
| Ownership model | |
| Primary & withdrawals | |
| Mortgage | |
| Rental vs Other Income | |
| Rental expenses | |
| Appreciation | |
| Taxes | |
| Reporting | |
| Monte Carlo | |
| UI | |
| Phase order | |

**Approved by:** _________________ **Date:** _________________

---

## After this is filled

Recommended engineering start order:

1. Data model + migration + CRUD API
2. Wire into `RetirementScenarioService.generate_projection`
3. Frontend Real Estate page + net worth on scenario summary
4. Follow-ons per Phase 2+ decisions above
